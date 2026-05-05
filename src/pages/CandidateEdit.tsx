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

  if (loading) return <div className="page"><p>Chargement…</p></div>;
  if (!candidate) return <div className="page"><h2>Candidat introuvable</h2><Link to="/">Retour</Link></div>;

  async function save(next: Candidate) {
    if (!user) return;
    await upsertCandidateRemote(next, user.id);
    navigate(`/candidats/${next.id}`);
  }

  return (
    <div className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Modification</p>
          <h2>{candidate.firstName} {candidate.lastName}</h2>
        </div>
      </header>
      <CandidateForm initialCandidate={candidate} onSubmit={save} />
    </div>
  );
}
