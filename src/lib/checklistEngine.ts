import { documentRules, resolveDocumentPresence } from "./rules";
import type { AidProjection, Candidate, DocumentChecklist } from "../types/candidate";

export function generateDocumentChecklist(
  candidate: Candidate,
  aids: AidProjection[]
): DocumentChecklist[] {
  const checklist: DocumentChecklist[] = [];

  for (const aid of aids) {
    if (aid.status === "exclu" || aid.status === "non_applicable") continue;
    const rules = documentRules[aid.id];
    if (!rules) continue;

    for (const rule of rules) {
      const present = resolveDocumentPresence(rule.key, candidate);
      checklist.push({
        aidId: aid.id,
        aidName: aid.name,
        document: rule.label,
        required: rule.required,
        status: present ? "present" : rule.required ? "manquant" : "a_verifier",
        comment: rule.comment,
      });
    }
  }

  return checklist;
}

export function calculateDocumentScore(checklist: DocumentChecklist[]): number {
  const required = checklist.filter((entry) => entry.required);
  if (required.length === 0) return 100;
  const present = required.filter((entry) => entry.status === "present").length;
  return Math.round((present / required.length) * 100);
}
