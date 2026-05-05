import { useEffect, useState, useCallback } from "react";
import { fetchCandidates } from "../lib/candidatesRepo";
import { useAuth } from "../lib/auth";
import type { Candidate } from "../types/candidate";

export function useCandidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCandidates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCandidates();
      setCandidates(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { candidates, refresh, loading, error };
}
