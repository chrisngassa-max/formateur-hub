import { Link } from "react-router-dom";
import { CandidateTable } from "../components/dashboard/CandidateTable";
import { formatCurrency } from "../lib/format";
import { projectCandidate } from "../lib/projectionEngine";
import { useCandidates } from "./useCandidates";

export function Dashboard() {
  const { candidates, loading, error } = useCandidates();
  const projections = candidates.map(projectCandidate);
  const priorityCount = projections.filter((p) => p.priority === "prioritaire").length;
  const incompleteCount = projections.filter((p) => p.priority === "a_completer").length;
  const followUpCount = projections.filter((p) => p.businessForecast.followUpDue).length;
  const blockedCount = projections.filter((p) => p.diagnostic.readinessStatus === "bloque").length;
  const urgentCount = projections.filter((p) => p.diagnostic.readinessStatus === "urgent").length;
  const prudentRevenue = projections.reduce((t, p) => t + p.businessForecast.prudentRevenue, 0);
  const optimisticRevenue = projections.reduce((t, p) => t + p.businessForecast.optimisticRevenue, 0);
  const averageRemaining = projections.reduce((t, p) => t + p.estimatedRemainingCost, 0) / Math.max(1, projections.length);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Préqualification financement</p>
          <h2>Dashboard conseiller</h2>
          <p>Classement des candidats par potentiel de financement et complétude du dossier.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" to="/parametres">Paramètres / Import</Link>
          <Link className="button" to="/candidats/nouveau">Nouveau candidat</Link>
        </div>
      </header>

      {error && <p className="ai-error">Erreur : {error}</p>}
      {loading && <p>Chargement des candidats…</p>}

      <section className="stats-grid">
        <div className="stat-card"><span>Candidats</span><strong>{candidates.length}</strong></div>
        <div className="stat-card"><span>Dossiers prioritaires</span><strong>{priorityCount}</strong></div>
        <div className="stat-card"><span>À compléter</span><strong>{incompleteCount}</strong></div>
        <div className="stat-card"><span>Reste moyen</span><strong>{formatCurrency(averageRemaining)}</strong></div>
        <div className="stat-card"><span>CA prudent</span><strong>{formatCurrency(prudentRevenue)}</strong></div>
        <div className="stat-card"><span>CA optimiste</span><strong>{formatCurrency(optimisticRevenue)}</strong></div>
        <div className="stat-card"><span>Relances 21j</span><strong>{followUpCount}</strong></div>
        <div className="stat-card"><span>Bloques</span><strong>{blockedCount}</strong></div>
        <div className="stat-card"><span>Urgents</span><strong>{urgentCount}</strong></div>
      </section>

      <CandidateTable candidates={candidates} />
    </div>
  );
}
