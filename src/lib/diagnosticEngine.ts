import type { AidProjection, Candidate, DiagnosticResult } from "../types/candidate";
import { thresholds } from "./rules";

function isEmployee(candidate: Candidate): boolean {
  return candidate.status === "salarie_cdi" || candidate.status === "salarie_cdd";
}

function isTns(candidate: Candidate): boolean {
  return candidate.status === "tns" || candidate.status === "auto_entrepreneur";
}

function daysUntil(dateValue?: string): number | null {
  if (!dateValue) return null;
  const start = new Date(dateValue);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
}

function businessDaysUntil(dateValue?: string): number | null {
  const calendarDays = daysUntil(dateValue);
  if (calendarDays === null) return null;
  if (calendarDays <= 0) return calendarDays;

  let businessDays = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let index = 0; index < calendarDays; index += 1) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) businessDays += 1;
  }
  return businessDays;
}

function hasAid(aids: AidProjection[], id: string): boolean {
  return aids.some((aid) => aid.id === id && aid.status !== "exclu" && aid.status !== "non_applicable");
}

function resolvePrimaryPath(candidate: Candidate, aids: AidProjection[], remainingCost: number): DiagnosticResult["primaryPath"] {
  if (isEmployee(candidate) && hasAid(aids, "opco")) return "OPCO";
  if (candidate.status === "demandeur_emploi" && hasAid(aids, "aif")) return "CPF_AIF";
  if (isTns(candidate) && hasAid(aids, "faf")) return "FAF";
  if (candidate.hasRqth && hasAid(aids, "agefiph")) return "AGEFIPH";
  if (hasAid(aids, "cpf")) return "CPF";
  if (remainingCost > 0) return "PAIEMENT";
  return "A_COMPLETER";
}

function isPostTrainingStage(candidate: Candidate): boolean {
  return ["en_cours", "a_justifier", "paiement_declenche", "clos", "accepte"].includes(candidate.dossierStatus);
}

export function diagnoseCandidate(input: {
  candidate: Candidate;
  aids: AidProjection[];
  estimatedRemainingCost: number;
  missingFields: string[];
}): DiagnosticResult {
  const { candidate, aids, estimatedRemainingCost, missingFields } = input;
  const calendarWarnings: string[] = [];
  const blockingIssues: string[] = [];
  const paymentWarnings: string[] = [];
  const primaryPath = resolvePrimaryPath(candidate, aids, estimatedRemainingCost);
  const daysToStart = daysUntil(candidate.trainingStartDate);
  const businessDaysToStart = businessDaysUntil(candidate.trainingStartDate);

  if (candidate.isQualiopiProvider === false && thresholds.qualiopiRequiredForPublicFunds) {
    blockingIssues.push("OF Qualiopi non confirme : financements publics ou mutualises tres fragiles.");
  }
  if (candidate.isQualiopiProvider === undefined) {
    missingFields.push("Certification Qualiopi OF");
  }
  if (!candidate.trainingStartDate) {
    missingFields.push("Date de debut de formation");
  }

  if (hasAid(aids, "cpf") && businessDaysToStart !== null && businessDaysToStart < thresholds.cpfWithdrawalDelayBusinessDays) {
    calendarWarnings.push(`Delai CPF insuffisant : ${businessDaysToStart} jours ouvres avant demarrage, minimum indicatif ${thresholds.cpfWithdrawalDelayBusinessDays}.`);
  }
  if (hasAid(aids, "opco") && daysToStart !== null && daysToStart < thresholds.opcoRecommendedDepositDays) {
    calendarWarnings.push(`Delai OPCO court : ${daysToStart} jours avant demarrage, viser ${thresholds.opcoRecommendedDepositDays} jours.`);
  }

  if (candidate.trainingDuringWorkTime && candidate.employerAgreementStatus !== "oui") {
    blockingIssues.push("Formation sur temps de travail : accord employeur absent ou inconnu.");
  }
  if (isEmployee(candidate) && candidate.trainingDuringWorkTime === undefined) {
    missingFields.push("Formation sur temps de travail");
  }

  if (isPostTrainingStage(candidate)) {
    if (!candidate.attendanceSheetsCollected) paymentWarnings.push("Emargements non collectes : paiement OPCO/CPF non securise.");
    if (!candidate.completionCertificateCollected) paymentWarnings.push("Certificat de realisation manquant.");
    if (!candidate.attendanceCertificateCollected) paymentWarnings.push("Attestation d'assiduite manquante.");
    if (!candidate.invoiceIssued) paymentWarnings.push("Facture non emise.");
  }

  let readinessStatus: DiagnosticResult["readinessStatus"] = "pret";
  if (missingFields.length > 0) readinessStatus = "a_completer";
  if (calendarWarnings.length > 0) readinessStatus = "urgent";
  if (blockingIssues.length > 0) readinessStatus = "bloque";

  const recommendedNextStep =
    readinessStatus === "bloque"
      ? blockingIssues[0]
      : readinessStatus === "urgent"
        ? calendarWarnings[0]
        : readinessStatus === "a_completer"
          ? `Completer : ${missingFields[0]}.`
          : primaryPath === "PAIEMENT"
            ? "Preparer une proposition de paiement echelonne."
            : "Dossier exploitable : preparer le depot financeur.";

  return {
    primaryPath,
    readinessStatus,
    calendarWarnings,
    blockingIssues,
    paymentWarnings,
    recommendedNextStep,
  };
}
