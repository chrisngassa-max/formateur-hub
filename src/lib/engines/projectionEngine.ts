import { DossierContext, FinancialProjection } from '../../types/DossierContext';

/**
 * projectionEngine.ts
 * Le cerveau financier de Predict.
 * Calcule les aides, le RAC et la conformité du dossier.
 */

export function runProjection(dossier: DossierContext): DossierContext {
  const updatedDossier = { ...dossier };
  const { administration, pedagogy, finances } = updatedDossier;

  // 1. Initialisation des scénarios
  let prudent: FinancialProjection = { aides_total: 0, rac: 0, detail: "Analyse en cours" };
  let moyen: FinancialProjection = { aides_total: 0, rac: 0, detail: "Analyse en cours" };
  let optimiste: FinancialProjection = { aides_total: 0, rac: 0, detail: "Analyse en cours" };

  // Estimation du coût total (ex: 15€/h de base)
  const baseRate = 15;
  const totalCost = (pedagogy.training_recommendation.recommended_hours || 0) * baseRate;

  // 2. Calcul du CPF (Socle commun)
  const mobilizedCpf = Math.min(finances.solde_cpf, totalCost);
  
  // Scénario Prudent : CPF Seul (ou 0 si non éligible)
  prudent.aides_total = updatedDossier.compliance.cpf_eligible ? mobilizedCpf : 0;
  prudent.rac = totalCost - prudent.aides_total;
  prudent.detail = prudent.aides_total > 0 ? "Prise en charge CPF uniquement" : "Reste à charge total";

  // 3. Calcul OPCO (Scénario Moyen)
  let opcoAide = 0;
  if (administration.student_status === 'salarie' && administration.company) {
    // Règle métier : <50 salariés = 100% du reste si éligible OPCO
    if (administration.company.size_bracket === '<50') {
      opcoAide = totalCost - mobilizedCpf;
    } else {
      opcoAide = (totalCost - mobilizedCpf) * 0.5; // 50% pour les plus grandes entreprises
    }
  }

  moyen.aides_total = prudent.aides_total + opcoAide;
  moyen.rac = totalCost - moyen.aides_total;
  moyen.detail = opcoAide > 0 ? `CPF + OPCO (${administration.company?.opco})` : prudent.detail;

  // 4. Bonus/AIF (Scénario Optimiste)
  let extraAide = 0;
  if (administration.student_status === 'demandeur_emploi') {
    extraAide = Math.min(totalCost - mobilizedCpf, 800); // Plafond AIF estimé
  }

  optimiste.aides_total = moyen.aides_total + extraAide;
  optimiste.rac = totalCost - optimiste.aides_total;
  optimiste.detail = extraAide > 0 ? "CPF + AIF (France Travail)" : moyen.detail;

  // 5. Mise à jour du dossier
  updatedDossier.finances = {
    ...finances,
    projections: { prudent, moyen, optimiste },
    last_calculation_at: new Date().toISOString()
  };

  // 6. Mise à jour Compliance & Documents
  updateCompliance(updatedDossier, totalCost);
  
  return updatedDossier;
}

function updateCompliance(dossier: DossierContext, totalCost: number) {
  const missingFields: string[] = [];
  
  if (!dossier.administration.student_status) missingFields.push('statut_etudiant');
  if (dossier.administration.student_status === 'salarie' && !dossier.administration.company?.siret) {
    missingFields.push('siret_entreprise');
  }

  dossier.compliance.missing_mandatory_fields = missingFields;
  
  // Risque de délai (ex: moins de 11 jours ouvrés pour CPF)
  // dossier.compliance.deadline_risk = ... logic here

  // Priorité du dossier
  if (dossier.finances.projections.moyen.rac === 0) {
    dossier.pipeline.priority = 'haute';
  } else if (dossier.finances.projections.moyen.aides_total > (totalCost * 0.8)) {
    dossier.pipeline.priority = 'moyenne';
  } else {
    dossier.pipeline.priority = 'basse';
  }
}
