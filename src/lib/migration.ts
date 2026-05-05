import { seedCandidates } from "../data/seedCandidates";
import { upsertCandidateRemote } from "./candidatesRepo";
import type { Candidate } from "../types/candidate";

const STORAGE_KEY = "formapredict:candidates";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Lecture du localStorage (fallback uniquement, pour la migration). */
export function loadLocalCandidates(): Candidate[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Candidate[];
  } catch {
    return [];
  }
}

export function clearLocalCandidates(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Importe candidats locaux + seeds vers Supabase, en évitant les doublons d'id. */
export async function importLocalAndSeedToCloud(
  ownerId: string,
  existingIds: Set<string>,
  options: { includeSeeds: boolean; includeLocal: boolean },
): Promise<{ imported: number; skipped: number }> {
  const pool: Candidate[] = [];
  if (options.includeLocal) pool.push(...loadLocalCandidates());
  if (options.includeSeeds) pool.push(...seedCandidates);

  let imported = 0;
  let skipped = 0;
  for (const c of pool) {
    if (existingIds.has(c.id)) { skipped++; continue; }
    try {
      await upsertCandidateRemote(c, ownerId);
      existingIds.add(c.id);
      imported++;
    } catch {
      skipped++;
    }
  }
  return { imported, skipped };
}
