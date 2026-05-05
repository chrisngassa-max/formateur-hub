import type { AidProjection, Candidate, ProjectionResult } from "../types/candidate";
import { calculateDocumentScore, generateDocumentChecklist } from "./checklistEngine";
import { diagnoseCandidate } from "./diagnosticEngine";
import { generateFolderTree } from "./folderEngine";
import { clamp } from "./format";
import { generateFollowUpQuestions } from "./followUpEngine";
import { generateInternalNote } from "./noteEngine";
import { getAidChecks, getAidConfidence, getAidLabel, resolveFunderByNaf, thresholds } from "./rules";

function isEmployee(candidate: Candidate): boolean {
  return candidate.status === "salarie_cdi" || candidate.status === "salarie_cdd";
}

function isTns(candidate: Candidate): boolean {
  return candidate.status === "tns" || candidate.status === "auto_entrepreneur";
}

function isJobSeeker(candidate: Candidate): boolean {
  return candidate.status === "demandeur_emploi";
}

function isLinguisticOrSafetyTraining(candidate: Candidate): boolean {
  const text = `${candidate.trainingType} ${candidate.trainingName} ${candidate.certificationName ?? ""}`.toLowerCase();
  return (
    ["fle", "tcf_irn", "tcf_tp", "anglais_pro", "cloe", "lilate"].includes(candidate.trainingType) ||
    text.includes("fran") ||
    text.includes("lang") ||
    text.includes("securite") ||
    text.includes("sécurité")
  );
}

function isOpcoIdentified(candidate: Candidate): boolean {
  return Boolean(candidate.knownOpco?.trim() || resolveFunderByNaf(candidate.employerNaf)?.opco);
}

function hasDelfDalfAlert(candidate: Candidate): boolean {
  const text = `${candidate.trainingName} ${candidate.certificationName ?? ""}`.toLowerCase();
  return text.includes("delf") || text.includes("dalf");
}

function eligibleCpf(candidate: Candidate): boolean {
  return candidate.isCertified && (candidate.registryType === "rncp" || candidate.registryType === "rs");
}

function getCpfFlatFeeInfo(candidate: Candidate): { applied: boolean; amount: number; note?: string } {
  if (!eligibleCpf(candidate) || hasDelfDalfAlert(candidate) || !candidate.cpfAlreadyUsed) {
    return { applied: false, amount: 0 };
  }
  if (isJobSeeker(candidate)) return { applied: false, amount: 0, note: "Exonere : demandeur d'emploi." };
  if (candidate.employerCofundingPossible) return { applied: false, amount: 0, note: "Exonere : cofinancement employeur a confirmer." };
  if (candidate.hasRqth) {
    return {
      applied: false,
      amount: 0,
      note: "Exoneration RQTH/OETH sous reserve de validation par MonCompteFormation.",
    };
  }
  return { applied: true, amount: thresholds.cpfFlatFee };
}

function estimateCpf(candidate: Candidate): number {
  if (!eligibleCpf(candidate) || hasDelfDalfAlert(candidate)) return 0;
  const cap = candidate.registryType === "rs" ? thresholds.cpfRsCap : candidate.trainingCostHt;
  const flatFee = getCpfFlatFeeInfo(candidate).amount;
  return Math.max(0, Math.min(candidate.cpfBalance, cap, candidate.trainingCostHt) - flatFee);
}

function estimateFafName(candidate: Candidate): string {
  if (candidate.knownFaf) return candidate.knownFaf;
  if (candidate.tnsActivityType === "liberal") return "FIF-PL";
  if (candidate.tnsActivityType === "artisan") return "FAFCEA";
  if (candidate.tnsActivityType === "commercant") return "AGEFICE";
  return "FAF à identifier";
}

function addAid(aids: AidProjection[], aid: AidProjection): void {
  aids.push(aid);
}

function getSuggestedPath(candidate: Candidate, aids: AidProjection[]): string {
  if (isEmployee(candidate) && aids.some((aid) => aid.id === "opco" && aid.status === "probable")) {
    return "Priorite OPCO";
  }
  if (isJobSeeker(candidate) && aids.some((aid) => aid.id === "aif")) {
    return "Priorite CPF + AIF";
  }
  if (isTns(candidate)) return `Priorite ${estimateFafName(candidate)}`;
  if (aids.some((aid) => aid.id === "cpf" && aid.status === "probable")) return "Priorite CPF";
  return "Aide limitee - paiement a proposer";
}

function resolveOpcoName(candidate: Candidate): string | undefined {
  return candidate.knownOpco?.trim() || resolveFunderByNaf(candidate.employerNaf)?.opco;
}

function getFollowUpAt(candidate: Candidate): string | undefined {
  if (!candidate.sentAt) return undefined;
  const date = new Date(candidate.sentAt);
  date.setDate(date.getDate() + thresholds.followUpDelayDays);
  return date.toISOString();
}

export function projectCandidate(candidate: Candidate): ProjectionResult {
  const aids: AidProjection[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];
  const compatibilityNotes: string[] = [];
  const recommendedActions: string[] = [];
  let rawScore = 0;

  if (eligibleCpf(candidate) && !hasDelfDalfAlert(candidate)) {
    const amount = estimateCpf(candidate);
    rawScore += 30;
    if (amount >= candidate.trainingCostHt * 0.5) rawScore += 15;
    addAid(aids, {
      id: "cpf",
      name: getAidLabel("cpf", "CPF"),
      status: "probable",
      estimatedAmount: amount,
      confidence: getAidConfidence("cpf"),
      reason: "Formation déclarée certifiante et inscrite RNCP/RS.",
      requiredChecks: getAidChecks("cpf", [
        "Vérifier l'inscription exacte de la certification.",
        "Confirmer le solde CPF réel sur Mon Compte Formation.",
      ]),
    });
    if (candidate.registryType === "rs") {
      compatibilityNotes.push(`Plafond RS appliqué à ${thresholds.cpfRsCap} €, depuis le 26/02/2026, hors cofinancements.`);
    }
    if (!isJobSeeker(candidate) && candidate.cpfAlreadyUsed) {
      if (candidate.employerCofundingPossible || candidate.hasRqth) {
        compatibilityNotes.push("Exoneration CPF potentielle : cofinancement employeur ou situation OETH/RQTH a verifier sur justificatif.");
      } else {
        compatibilityNotes.push(`Ticket modérateur CPF ${thresholds.cpfFlatFee} € retenu pour les actifs hors exonération.`);
      }
    }
  } else {
    rawScore -= candidate.registryType === "non_certifiante" ? 25 : 0;
    addAid(aids, {
      id: "cpf",
      name: getAidLabel("cpf", "CPF"),
      status: hasDelfDalfAlert(candidate) ? "exclu" : "a_verifier",
      confidence: getAidConfidence("cpf"),
      reason: hasDelfDalfAlert(candidate)
        ? "Alerte DELF/DALF : financement CPF signalé comme exclu dans le cahier des charges."
        : "Certification RNCP/RS absente ou inconnue.",
      requiredChecks: getAidChecks("cpf", ["Vérifier l'inscription RNCP/RS de la formation."]),
    });
  }

  if (hasDelfDalfAlert(candidate)) {
    rawScore -= 10;
    warnings.push("DELF/DALF détecté : financement CPF à exclure ou vérifier fortement.");
  }

  if (isJobSeeker(candidate) && candidate.registeredFranceTravail) {
    rawScore += 20;
    addAid(aids, {
      id: "aif",
      name: getAidLabel("aif", "France Travail - AIF"),
      status: "a_verifier",
      confidence: getAidConfidence("aif"),
      reason: "Candidat demandeur d'emploi inscrit France Travail.",
      requiredChecks: getAidChecks("aif", ["Validation du projet par le conseiller France Travail.", "Devis et programme de formation."]),
    });
  }

  if (isJobSeeker(candidate) && candidate.receivesAre && candidate.trainingHours > thresholds.areMinHours) {
    addAid(aids, {
      id: "are-f",
      name: getAidLabel("are-f", "ARE-F"),
      status: "a_verifier",
      confidence: getAidConfidence("are-f"),
      reason: `Demandeur d'emploi indemnisé ARE avec formation de plus de ${thresholds.areMinHours}h.`,
      requiredChecks: getAidChecks("are-f", ["Confirmer la durée de droits ARE.", "Vérifier le passage en ARE-F."]),
    });
    compatibilityNotes.push("AIF et ARE-F relèvent d'une validation France Travail et ne doivent pas être présentées comme cumul automatique.");
  }

  if (isEmployee(candidate)) {
    const isSmallEmployer = Boolean(candidate.employerSize && candidate.employerSize < thresholds.smallEmployerMaxSize);
    const resolvedOpco = resolveOpcoName(candidate);
    addAid(aids, {
      id: "opco",
      name: getAidLabel("opco", "OPCO / Plan de développement des compétences"),
      status: isSmallEmployer ? "probable" : "a_verifier",
      confidence: getAidConfidence("opco"),
      reason: "Candidat salarié : l'OPCO ou l'employeur peuvent être mobilisés.",
      requiredChecks: getAidChecks("opco", ["Identifier l'OPCO via le code NAF.", "Valider l'accord employeur."]),
    });
    rawScore += isSmallEmployer ? 20 : 8;
    if (resolvedOpco) {
      compatibilityNotes.push(`OPCO suggere depuis le code NAF : ${resolvedOpco}.`);
    }
    if (isSmallEmployer && isLinguisticOrSafetyTraining(candidate)) {
      rawScore += 20;
      recommendedActions.push("Orientation forte : dossier OPCO/PDC pour entreprise de moins de 50 salaries.");
    }
    compatibilityNotes.push("CPF + OPCO ou employeur : cofinancement possible, à confirmer avec l'entreprise.");
  }

  if (isEmployee(candidate) && candidate.isCertified && candidate.registryType !== "non_certifiante") {
    rawScore += 15;
    addAid(aids, {
      id: "periode-reconversion",
      name: getAidLabel("periode-reconversion", "Période de reconversion"),
      status: "a_verifier",
      confidence: getAidConfidence("periode-reconversion"),
      reason: "Depuis 2026, la Pro-A est remplacée par la Période de reconversion pour les salariés avec formation certifiante.",
      requiredChecks: getAidChecks("periode-reconversion", [
        "Vérifier accord écrit CERFA salarié + employeur.",
        "Vérifier convention de formation avec OF Qualiopi.",
      ]),
    });
    compatibilityNotes.push("Pro-A supprimée au 31/12/2025 : utiliser Période de reconversion pour les nouveaux dossiers.");
  }

  if (
    candidate.status === "salarie_cdi" &&
    candidate.projectGoal === "reconversion" &&
    candidate.trainingHours <= thresholds.ptpPriorityMaxHours
  ) {
    rawScore += 15;
    addAid(aids, {
      id: "ptp",
      name: getAidLabel("ptp", "Transitions Pro / PTP"),
      status: "a_verifier",
      confidence: getAidConfidence("ptp", "faible"),
      reason: `Projet de reconversion salarié CDI avec durée inférieure ou égale à ${thresholds.ptpPriorityMaxHours}h.`,
      requiredChecks: getAidChecks("ptp", ["Vérifier ancienneté.", "Préparer bilan de positionnement.", "Analyser priorités régionales Transitions Pro."]),
    });
    compatibilityNotes.push("PTP incompatible avec OPCO/PDC et Période de reconversion pour un même financement principal.");
  }

  if (isTns(candidate)) {
    rawScore += 8;
    addAid(aids, {
      id: "faf",
      name: estimateFafName(candidate),
      status: candidate.tnsNaf || candidate.knownFaf ? "probable" : "a_verifier",
      confidence: candidate.tnsNaf || candidate.knownFaf ? getAidConfidence("faf") : "faible",
      reason: "Travailleur indépendant ou auto-entrepreneur.",
      requiredChecks: getAidChecks("faf", ["Confirmer le code NAF.", "Vérifier le FAF compétent et ses plafonds."]),
    });
  }

  if (candidate.hasRqth) {
    rawScore += 10;
    addAid(aids, {
      id: "agefiph",
      name: getAidLabel("agefiph", "Agefiph"),
      status: "a_verifier",
      estimatedAmount: candidate.projectGoal === "creation_entreprise" ? thresholds.agefiphCreationAmount : undefined,
      confidence: candidate.projectGoal === "creation_entreprise" ? "moyenne" : "faible",
      reason:
        candidate.projectGoal === "creation_entreprise"
          ? "RQTH et projet de création d'entreprise."
          : "RQTH déclarée : aides Agefiph potentielles selon situation.",
      requiredChecks: getAidChecks("agefiph", ["Vérifier justificatif RQTH.", "Confirmer l'aide mobilisable selon le projet."]),
    });
  }

  if (candidate.employerCofundingPossible) rawScore += 5;
  if ((candidate.personalBudget ?? 0) > 0 || candidate.acceptsInstallments) rawScore += 5;
  if (candidate.cpfBalance < candidate.trainingCostHt * 0.2) rawScore -= 10;

  if (isEmployee(candidate)) {
    if (!candidate.employerSiret) missingFields.push("SIRET employeur");
    if (!candidate.employerNaf) missingFields.push("Code NAF employeur");
    if (!candidate.employerName) missingFields.push("Nom employeur");
    if (!candidate.employerSiret || !candidate.employerNaf) rawScore -= 15;
  }

  if (isTns(candidate)) {
    if (!candidate.tnsSiret) missingFields.push("SIRET indépendant");
    if (!candidate.tnsNaf) missingFields.push("Code NAF indépendant");
    if (!candidate.tnsSiret || !candidate.tnsNaf) rawScore -= 15;
  }

  const criticalValues = [
    candidate.firstName,
    candidate.lastName,
    candidate.email,
    candidate.phone,
    candidate.status,
    candidate.diplomaLevel,
    candidate.trainingName,
    candidate.projectGoal,
    candidate.trainingHours > 0,
    candidate.trainingCostHt > 0,
    candidate.registryType,
    candidate.trainingStartDate,
    candidate.isQualiopiProvider !== undefined,
    typeof candidate.cpfBalance === "number",
    typeof candidate.hasRqth === "boolean",
  ];
  const completionScore = Math.round(
    (criticalValues.filter(Boolean).length / criticalValues.length) * 100
  );

  if (!candidate.isCertified || candidate.registryType === "non_certifiante") {
    warnings.push("Formation non certifiante ou non inscrite RNCP/RS : financement plus fragile.");
  }
  if (missingFields.length > 0) {
    warnings.push("Informations critiques manquantes : la projection doit être complétée.");
  }

  const cpfEstimated = estimateCpf(candidate);
  const cpfFlatFeeInfo = getCpfFlatFeeInfo(candidate);
  const probableAidTotal = aids
    .filter((aid) => aid.id !== "cpf" && aid.status === "probable")
    .reduce((total, aid) => total + (aid.estimatedAmount ?? 0), 0);
  const employerEstimated = candidate.employerCofundingPossible
    ? Math.max(0, Math.min(candidate.trainingCostHt * thresholds.employerCofundingRate, candidate.trainingCostHt - cpfEstimated))
    : 0;
  const personalBudget = candidate.personalBudget ?? 0;
  const estimatedRemainingCost = Math.max(
    0,
    candidate.trainingCostHt - cpfEstimated - probableAidTotal - employerEstimated - personalBudget
  );
  const diagnostic = diagnoseCandidate({ candidate, aids, estimatedRemainingCost, missingFields });
  if (diagnostic.blockingIssues.length > 0) rawScore -= 25;
  if (diagnostic.calendarWarnings.length > 0) rawScore -= 10;
  if (diagnostic.paymentWarnings.length > 0) rawScore -= 5;
  if (diagnostic.readinessStatus === "a_completer") rawScore -= 5;
  warnings.push(...diagnostic.blockingIssues, ...diagnostic.calendarWarnings, ...diagnostic.paymentWarnings);
  recommendedActions.push(diagnostic.recommendedNextStep);

  const missingDocuments = generateDocumentChecklist(candidate, aids);
  const documentScore = calculateDocumentScore(missingDocuments);
  rawScore += documentScore >= 90 ? 20 : Math.round(documentScore * 0.1);

  let financingScore = Math.round(clamp(rawScore));
  if (isEmployee(candidate) && !isOpcoIdentified(candidate)) {
    financingScore = Math.min(financingScore, thresholds.opcoUnknownScoreCap);
    warnings.push("OPCO non identifie via NAF ou saisie manuelle : score plafonne a 50.");
    recommendedActions.push("Identifier l'OPCO via le code NAF ou une saisie manuelle avant priorisation.");
  }

  let priority: ProjectionResult["priority"] = "aide_limitee";
  if (completionScore < thresholds.lowCompletionScore) priority = "a_completer";
  else if (financingScore >= thresholds.priorityFinancingScore && completionScore >= thresholds.priorityCompletionScore) priority = "prioritaire";
  else if (financingScore >= thresholds.partialFinancingScore) priority = "financement_partiel";

  if (priority === "prioritaire") recommendedActions.push("Monter ce dossier en priorité.");
  if (priority === "financement_partiel") recommendedActions.push("Chercher un cofinancement employeur, OPCO ou personnel.");
  if (priority === "aide_limitee") recommendedActions.push("Proposer un paiement en 3x ou 6x et vérifier les aides secondaires.");
  if (priority === "a_completer") recommendedActions.push("Compléter les informations manquantes avant décision interne.");
  if (estimatedRemainingCost > 0 && candidate.acceptsInstallments) {
    recommendedActions.push("Préparer une proposition de paiement échelonné.");
  }

  const folderTree = generateFolderTree(candidate, missingDocuments);
  const opcoCoverageRate =
    typeof candidate.opcoManualCoverageRate === "number"
      ? candidate.opcoManualCoverageRate
      : 1 - thresholds.opcoAverageRemainingChargeRate;
  const opcoRateEstimated = candidate.opcoHourlyRate
    ? Math.max(0, candidate.trainingHours * candidate.opcoHourlyRate)
    : candidate.trainingCostHt * opcoCoverageRate;
  const opcoCappedEstimated = candidate.opcoFlatCap
    ? Math.min(opcoRateEstimated, candidate.opcoFlatCap)
    : opcoRateEstimated;
  const opcoOptimisticEstimated = isEmployee(candidate)
    ? Math.max(0, Math.min(opcoCappedEstimated, candidate.trainingCostHt - cpfEstimated))
    : 0;
  const optimisticAidEstimated = Math.max(probableAidTotal, opcoOptimisticEstimated);
  const prudentRevenue = Math.max(0, Math.min(candidate.trainingCostHt, cpfEstimated + probableAidTotal + employerEstimated + personalBudget));
  const optimisticRevenue = Math.max(0, Math.min(candidate.trainingCostHt, cpfEstimated + optimisticAidEstimated + employerEstimated + personalBudget));
  const expectedRemainingCost = Math.max(0, candidate.trainingCostHt - optimisticRevenue);
  const followUpAt = getFollowUpAt(candidate);
  const followUpDue =
    Boolean(followUpAt && new Date(followUpAt).getTime() <= Date.now()) &&
    (candidate.dossierStatus === "envoye" || candidate.dossierStatus === "transmis");
  const adminRiskScore = Math.round(
    clamp(
      100 -
        documentScore * 0.45 -
        completionScore * 0.35 -
        financingScore * 0.2 +
        warnings.length * 8 +
        missingFields.length * 6 +
        diagnostic.blockingIssues.length * 10 +
        diagnostic.calendarWarnings.length * 6 +
        diagnostic.paymentWarnings.length * 5
    )
  );
  const baseProjection = {
    aids,
    priority,
    financingScore,
    completionScore,
    documentScore,
    adminRiskScore,
    estimatedRemainingCost,
    missingFields,
    warnings,
    recommendedActions,
  };
  const followUpQuestions = generateFollowUpQuestions(candidate, baseProjection);
  const internalNote = generateInternalNote(candidate, baseProjection, followUpQuestions);

  return {
    financingScore,
    completionScore,
    documentScore,
    adminRiskScore,
    priority,
    estimatedRemainingCost,
    financialBreakdown: {
      trainingCost: candidate.trainingCostHt,
      cpfEstimated,
      aidEstimated: probableAidTotal,
      employerEstimated,
      personalBudget,
      estimatedRemainingCost,
      cpfFlatFeeApplied: cpfFlatFeeInfo.applied,
      cpfFlatFeeAmount: cpfFlatFeeInfo.amount,
      cpfFlatFeeNote: cpfFlatFeeInfo.note,
      confidence: missingFields.length > 0 ? "faible" : aids.some((aid) => aid.status === "a_verifier") ? "moyenne" : "forte",
    },
    businessForecast: {
      prudentRevenue,
      optimisticRevenue,
      expectedRemainingCost,
      suggestedPath: getSuggestedPath(candidate, aids),
      followUpDue,
      followUpAt,
    },
    diagnostic,
    aids,
    missingDocuments,
    folderTree,
    followUpQuestions,
    internalNote,
    warnings,
    missingFields,
    compatibilityNotes,
    recommendedActions,
  };
}
