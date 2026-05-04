import aidsJson from "../data/rules/aids.json";
import documentsJson from "../data/rules/documents.json";
import thresholdsJson from "../data/rules/thresholds.json";
import type { Candidate } from "../types/candidate";

export type Thresholds = {
  cpfFlatFee: number;
  cpfRsCap: number;
  ptpPriorityMaxHours: number;
  areMinHours: number;
  smallEmployerMaxSize: number;
  priorityFinancingScore: number;
  priorityCompletionScore: number;
  partialFinancingScore: number;
  lowCompletionScore: number;
  employerCofundingRate: number;
  agefiphCreationAmount: number;
};

export type AidRule = {
  label: string;
  defaultConfidence: "forte" | "moyenne" | "faible";
  checks: string[];
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

export function getAidLabel(id: string, fallback: string): string {
  return aidRules[id]?.label ?? fallback;
}

export function getAidChecks(id: string, fallback: string[] = []): string[] {
  return aidRules[id]?.checks ?? fallback;
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
