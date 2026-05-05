import { supabase } from "../integrations/supabase/client";
import type { Candidate, FollowUpQuestion, ProjectionResult } from "../types/candidate";

export type AiAnalysis = {
  summary: string;
  confidence: "forte" | "moyenne" | "faible";
  probable_aids: string[];
  next_questions: Array<{
    question: string;
    field?: keyof Candidate | "";
    priority: "haute" | "moyenne" | "basse";
    reason: string;
    target: FollowUpQuestion["target"];
  }>;
  missing_documents: Array<{ name: string; required_for: string; status: "present" | "manquant" | "a_verifier" }>;
  risk_flags: string[];
  projection_comment: string;
};

export type AiAnalyzeResponse =
  | { ok: true; mode: "anthropic"; result: AiAnalysis }
  | { ok: false; mode: "local_fallback"; error: string; raw?: string };

export async function analyzeCandidateWithAi(input: {
  candidate: Candidate;
  projection: ProjectionResult;
  localQuestion: FollowUpQuestion | null;
}): Promise<AiAnalyzeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-candidate", { body: input });
    if (error) {
      return { ok: false, mode: "local_fallback", error: error.message };
    }
    return data as AiAnalyzeResponse;
  } catch (e) {
    return {
      ok: false,
      mode: "local_fallback",
      error: e instanceof Error ? e.message : "IA indisponible.",
    };
  }
}
