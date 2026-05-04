import aidsJson from "../data/rules/aids.json";
import compatibilitiesJson from "../data/rules/compatibilities.json";
import documentsJson from "../data/rules/documents.json";
import nafToFundersJson from "../data/rules/naf-to-funders.json";
import pointsToVerifyJson from "../data/rules/points-to-verify.json";
import thresholdsJson from "../data/rules/thresholds.json";
import trainingCertificationsJson from "../data/rules/training-certifications.json";
import type { Candidate } from "../types/candidate";

export type Thresholds = {
  cpfFlatFee: number;
  cpfRsCap: number;
  cpfBilanCap: number;
  cpfLightDrivingLicenceCap: number;
  cpfStandardAnnualCredit: number;
  cpfStandardTotalCap: number;
  cpfEnhancedAnnualCredit: number;
  cpfEnhancedTotalCap: number;
  ptpPriorityMaxHours: number;
  ptpIdfTotalCapHt: number;
  ptpIdfHourlyCapHt: number;
  ptpCdiSeniorityTotalMonths: number;
  ptpCdiCurrentEmployerMonths: number;
  periodReconversionMinHours: number;
  periodReconversionStandardMaxHours: number;
  periodReconversionStandardMaxMonths: number;
  periodReconversionExtendedMaxHours: number;
  periodReconversionExtendedMaxMonths: number;
  periodReconversionMinimumHourlyFunding: number;
  areMinHours: number;
  arefMinimumDailyAmount: number;
  rffMonthlyCeiling: number;
  smallEmployerMaxSize: number;
  opcoAverageTrainingCostHt: number;
  opcoAveragePedagogicCostHt: number;
  opcoAverageRemainingChargeRate: number;
  priorityFinancingScore: number;
  priorityCompletionScore: number;
  partialFinancingScore: number;
  lowCompletionScore: number;
  employerCofundingRate: number;
  agefiphCreationAmount: number;
  agefiphHumanAidMax: number;
  agefiphEmploymentPathAidMax: number;
  fafceaTechnicalHourly: number;
  fafceaTechnicalMaxHours: number;
  fafceaTransversalHourly: number;
  fafceaRncpHourlyMax: number;
  fafceaRncpTotalMax: number;
  fafceaMofFlatMax: number;
  fafceaManagementHourly: number;
  fafceaManagementAnnualMax: number;
  fafceaBusinessTransferHourlyMax: number;
  fafceaBusinessTransferMaxHours: number;
  ageficeMinHours: number;
  fafRequestMaxDaysAfterStart: number;
  agefiphRetroactivityMonths: number;
  tcfIrnValidityYears: number;
  sourceSummary: string;
};

export type AidRule = {
  label: string;
  defaultConfidence: "forte" | "moyenne" | "faible";
  checks: string[];
  eligibility?: string[];
  exclusions?: string[];
  sources?: string[];
};

export type DocumentRule = {
  key: string;
  label: string;
  required: boolean;
  comment?: string;
};

export const thresholds = thresholdsJson as Thresholds;
export const aidRules = aidsJson as Record<string, AidRule>;
export const documentRules = documentsJson as Record<string, DocumentRule[]>;
export const compatibilityRules = compatibilitiesJson as Record<string, unknown>;
export const trainingCertificationRules = trainingCertificationsJson as Record<string, unknown>;
export const nafToFundersRules = nafToFundersJson as Record<string, unknown>;
export const pointsToVerify = pointsToVerifyJson as Array<Record<string, unknown>>;

export function getAidLabel(id: string, fallback: string): string {
  return aidRules[id]?.label ?? fallback;
}

export function getAidChecks(id: string, fallback: string[] = []): string[] {
  return aidRules[id]?.checks ?? fallback;
}

export function getAidConfidence(
  id: string,
  fallback: "forte" | "moyenne" | "faible" = "moyenne"
): "forte" | "moyenne" | "faible" {
  return aidRules[id]?.defaultConfidence ?? fallback;
}

/**
 * Resolves a document presence predicate by key against a candidate.
 * Keys may be a Candidate field name, a derived alias, or `static:true|false`.
 */
export function resolveDocumentPresence(key: string, candidate: Candidate): boolean {
  if (key === "static:true") return true;
  if (key === "static:false") return false;

  switch (key) {
    case "isCertifiedRegistry":
      return candidate.isCertified && candidate.registryType !== "non_certifiante";
    case "diplomaUnderBac3":
      return candidate.diplomaLevel !== "bac3_plus";
    case "isReconversion":
      return candidate.projectGoal === "reconversion";
    case "trainingHoursUnder1200":
      return candidate.trainingHours > 0 && candidate.trainingHours <= 1200;
    case "trainingHoursUnderPtpPriorityMax":
      return candidate.trainingHours > 0 && candidate.trainingHours <= thresholds.ptpPriorityMaxHours;
    case "trainingHoursInPeriodReconversionStandardRange":
      return (
        candidate.trainingHours >= thresholds.periodReconversionMinHours &&
        candidate.trainingHours <= thresholds.periodReconversionStandardMaxHours
      );
    case "trainingHoursPositive":
      return candidate.trainingHours > 0;
    default:
      break;
  }

  const value = (candidate as unknown as Record<string, unknown>)[key];
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value > 0;
  if (typeof value === "boolean") return value;
  return Boolean(value);
}
