import { supabase } from "../integrations/supabase/client";
import type { Candidate } from "../types/candidate";

// Mapping: la table candidates stocke la majorité des champs dans `data` (JSONB)
// et expose des colonnes dédiées pour les recherches/filtres dossier.

type Row = {
  id: string;
  owner_id: string | null;
  data: Omit<Candidate, "id" | "createdAt" | "updatedAt" | "dossierStatus" | "sentAt" | "internalComment">;
  dossier_status: Candidate["dossierStatus"];
  sent_at: string | null;
  internal_comment: string | null;
  created_at: string;
  updated_at: string;
};

function rowToCandidate(row: Row): Candidate {
  return {
    ...(row.data as any),
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dossierStatus: row.dossier_status,
    sentAt: row.sent_at ?? undefined,
    internalComment: row.internal_comment ?? undefined,
  } as Candidate;
}

function candidateToInsert(c: Candidate, ownerId: string) {
  const { id, createdAt, updatedAt, dossierStatus, sentAt, internalComment, ...rest } = c;
  return {
    id,
    owner_id: ownerId,
    data: rest,
    dossier_status: dossierStatus,
    sent_at: sentAt ?? null,
    internal_comment: internalComment ?? null,
  };
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Row[]).map(rowToCandidate);
}

export async function fetchCandidate(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase.from("candidates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToCandidate(data as unknown as Row) : null;
}

export async function upsertCandidateRemote(c: Candidate, ownerId: string): Promise<Candidate> {
  const payload = candidateToInsert(c, ownerId);
  const { data, error } = await supabase
    .from("candidates")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return rowToCandidate(data as unknown as Row);
}

export async function deleteCandidateRemote(id: string): Promise<void> {
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) throw error;
}

export async function logCandidateEvent(
  candidateId: string,
  userId: string,
  eventType: string,
  payload?: Record<string, unknown>,
  comment?: string,
) {
  const { error } = await supabase.from("candidate_events").insert({
    candidate_id: candidateId,
    user_id: userId,
    event_type: eventType,
    payload: payload ?? null,
    comment: comment ?? null,
  });
  if (error) throw error;
}

export async function fetchCandidateEvents(candidateId: string) {
  const { data, error } = await supabase
    .from("candidate_events")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
