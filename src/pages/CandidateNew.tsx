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
    <div className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Saisie interne</p>
          <h2>Nouveau candidat</h2>
          <p>Renseignez les informations connues. Les champs conditionnels s'adaptent au statut.</p>
        </div>
      </header>
      <CandidateForm onSubmit={save} />
    </div>
  );
}
