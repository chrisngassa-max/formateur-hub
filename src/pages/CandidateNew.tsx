import { useNavigate } from "react-router-dom";
import { CandidateForm } from "../components/forms/CandidateForm";
import { upsertCandidateRemote } from "../lib/candidatesRepo";
import { useAuth } from "../lib/auth";
import type { Candidate } from "../types/candidate";

export function CandidateNew() {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function save(candidate: Candidate) {
    if (!user) return;
    await upsertCandidateRemote(candidate, user.id);
    navigate(`/candidats/${candidate.id}`);
  }

  return (
    <div className="flex flex-col gap-8 pb-12 w-full max-w-4xl mx-auto">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Saisie interne</p>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Nouveau candidat</h2>
        <p className="text-sm text-zinc-500">Renseignez les informations connues. Les champs conditionnels s'adaptent au statut.</p>
      </header>
      <CandidateForm onSubmit={save} />
    </div>
  );
}
