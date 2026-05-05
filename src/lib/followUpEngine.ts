import type { Candidate, FollowUpQuestion, ProjectionResult } from "../types/candidate";

function question(
  id: string,
  target: FollowUpQuestion["target"],
  questionText: string,
  reason: string,
  priority: FollowUpQuestion["priority"],
  relatedAidId?: string,
  field?: FollowUpQuestion["field"],
  answerType: FollowUpQuestion["answerType"] = "text",
  options?: FollowUpQuestion["options"]
): FollowUpQuestion {
  return { id, target, question: questionText, reason, priority, relatedAidId, field, answerType, options };
}

export function generateFollowUpQuestions(
  candidate: Candidate,
  projection: Pick<ProjectionResult, "aids" | "missingFields" | "estimatedRemainingCost">
): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = [];
  const isEmployee = candidate.status === "salarie_cdi" || candidate.status === "salarie_cdd";
  const isTns = candidate.status === "tns" || candidate.status === "auto_entrepreneur";
  const isJobSeeker = candidate.status === "demandeur_emploi";

  if (isEmployee && !candidate.employerSiret) {
    questions.push(question("employer-siret", "employeur", "Quel est le SIRET exact de l'entreprise ?", "Indispensable pour identifier l'OPCO et preparer le dossier employeur.", "haute", "opco", "employerSiret"));
  }
  if (isEmployee && !candidate.employerNaf) {
    questions.push(question("employer-naf", "employeur", "Quel est le code NAF / APE de l'entreprise ?", "Le code NAF aide a identifier l'OPCO et les regles applicables.", "haute", "opco", "employerNaf"));
  }
  if (isEmployee && !candidate.employerCofundingPossible) {
    questions.push(question("employer-cofunding", "employeur", "L'employeur accepte-t-il d'etudier un cofinancement ?", "Le reste a charge peut baisser avec un accord employeur ou OPCO.", "moyenne", "opco", "employerCofundingPossible", "boolean"));
  }
  if (isEmployee && candidate.trainingDuringWorkTime === undefined) {
    questions.push(question("training-worktime", "employeur", "La formation aura-t-elle lieu sur le temps de travail ?", "Si oui, l'accord employeur conditionne le dossier et le calendrier.", "haute", "opco", "trainingDuringWorkTime", "boolean"));
  }
  if (isEmployee && candidate.trainingDuringWorkTime && candidate.employerAgreementStatus !== "oui") {
    questions.push(question("employer-agreement", "employeur", "L'employeur a-t-il donne son accord pour la formation ?", "Un accord manquant bloque les dossiers sur temps de travail.", "haute", "opco", "employerAgreementStatus", "select", [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
      { value: "inconnu", label: "Inconnu" },
    ]));
  }
  if (isEmployee && !candidate.opcoHourlyRate && !candidate.opcoFlatCap) {
    questions.push(question("opco-rate", "conseiller", "Un bareme OPCO horaire ou plafond total est-il connu ?", "Le bareme evite une projection trop optimiste.", "moyenne", "opco", "opcoHourlyRate", "number"));
  }
  if (isTns && !candidate.tnsNaf) {
    questions.push(question("tns-naf", "candidat", "Quel est le code NAF / APE de l'activite independante ?", "Necessaire pour orienter vers FIF-PL, FAFCEA ou AGEFICE.", "haute", "faf", "tnsNaf"));
  }
  if (isJobSeeker && !candidate.registeredFranceTravail) {
    questions.push(question("ft-registration", "candidat", "Le candidat peut-il confirmer son inscription France Travail ?", "L'AIF et l'ARE-F necessitent une validation France Travail.", "haute", "aif", "registeredFranceTravail", "boolean"));
  }
  if (projection.aids.some((aid) => aid.id === "cpf" && aid.status !== "exclu")) {
    questions.push(question("cpf-balance", "candidat", "Quel est le solde CPF verifie sur Mon Compte Formation ?", "Le solde declare reste indicatif tant qu'il n'est pas confirme.", "moyenne", "cpf", "cpfBalance", "number"));
  }
  if (candidate.isCertified && candidate.registryType === "inconnu") {
    questions.push(question("registry-proof", "conseiller", "La certification est-elle bien inscrite RNCP ou RS ?", "Le financement CPF depend fortement de cette verification.", "haute", "cpf", "registryType", "select", [
      { value: "rncp", label: "RNCP" },
      { value: "rs", label: "RS" },
      { value: "non_certifiante", label: "Non certifiante" },
      { value: "inconnu", label: "Inconnu" },
    ]));
  }
  if (candidate.isQualiopiProvider === undefined) {
    questions.push(question("qualiopi", "conseiller", "L'organisme de formation est-il certifie Qualiopi ?", "Qualiopi est requis pour securiser les financements publics ou mutualises.", "haute", undefined, "isQualiopiProvider", "boolean"));
  }
  if (!candidate.trainingStartDate) {
    questions.push(question("training-start-date", "secretaire", "Quelle est la date de debut de formation ?", "La date permet de verifier les delais CPF et OPCO.", "haute", undefined, "trainingStartDate", "text"));
  }
  if (candidate.hasRqth) {
    questions.push(question("rqth-proof", "candidat", "Le justificatif RQTH est-il disponible ?", "La donnee est sensible et doit etre confirmee uniquement si utile au dossier.", "haute", "agefiph"));
  }
  if (projection.estimatedRemainingCost > 0 && !candidate.acceptsInstallments) {
    questions.push(question("installments", "candidat", "Le candidat accepterait-il un paiement en plusieurs fois si les aides ne couvrent pas tout ?", "Permet de preparer une alternative pour les profils partiellement financables.", "basse", undefined, "acceptsInstallments", "boolean"));
  }

  return questions;
}
