import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CandidateForm } from "../components/forms/CandidateForm";
import { fetchCandidate, upsertCandidateRemote } from "../lib/candidatesRepo";
import { useAuth } from "../lib/auth";
import type { Candidate } from "../types/candidate";

export function CandidateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchCandidate(id).then((c) => { setCandidate(c); setLoading(false); });
  }, [id]);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600"></div></div>;
  if (!candidate) return <div className="flex flex-col items-center justify-center h-[50vh] gap-4"><h2 className="text-xl font-bold text-zinc-900">Candidat introuvable</h2><Link to="/" className="text-indigo-600 hover:underline">Retour au tableau de bord</Link></div>;

  async function save(next: Candidate) {
    if (!user) return;
    await upsertCandidateRemote(next, user.id);
    navigate(`/candidats/${next.id}`);
  }

  return (
    <div className="flex flex-col gap-8 pb-12 w-full max-w-4xl mx-auto">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Modification</p>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">{candidate.firstName} {candidate.lastName}</h2>
      </header>
      <CandidateForm initialCandidate={candidate} onSubmit={save} />
    </div>
  );
}
