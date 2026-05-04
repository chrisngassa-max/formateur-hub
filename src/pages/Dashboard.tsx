import { Link } from "react-router-dom";
import { CandidateTable } from "../components/dashboard/CandidateTable";
import { formatCurrency } from "../lib/format";
import { projectCandidate } from "../lib/projectionEngine";
import { resetCandidates } from "../lib/storage";
import { useCandidates } from "./useCandidates";

export function Dashboard() {
  const { candidates, refresh } = useCandidates();
  const projections = candidates.map(projectCandidate);
  const priorityCount = projections.filter((projection) => projection.priority === "prioritaire").length;
  const incompleteCount = projections.filter((projection) => projection.priority === "a_completer").length;
  const followUpCount = projections.filter((projection) => projection.businessForecast.followUpDue).length;
  const prudentRevenue = projections.reduce((total, projection) => total + projection.businessForecast.prudentRevenue, 0);
  const optimisticRevenue = projections.reduce((total, projection) => total + projection.businessForecast.optimisticRevenue, 0);
  const averageRemaining =
    projections.reduce((total, projection) => total + projection.estimatedRemainingCost, 0) /
    Math.max(1, projections.length);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Préqualification financement</p>
          <h2>Dashboard conseiller</h2>
          <p>Classement des candidats par potentiel de financement et complétude du dossier.</p>
        </div>
        <div className="header-actions">
          <button
            className="secondary"
            onClick={() => {
              resetCandidates();
              refresh();
            }}
          >
            Réinitialiser exemples
          </button>
          <Link className="button" to="/candidats/nouveau">
            Nouveau candidat
          </Link>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Candidats</span>
          <strong>{candidates.length}</strong>
        </div>
        <div className="stat-card">
          <span>Dossiers prioritaires</span>
          <strong>{priorityCount}</strong>
        </div>
        <div className="stat-card">
          <span>À compléter</span>
          <strong>{incompleteCount}</strong>
        </div>
        <div className="stat-card">
          <span>Reste moyen</span>
          <strong>{formatCurrency(averageRemaining)}</strong>
        </div>
        <div className="stat-card">
          <span>CA prudent</span>
          <strong>{formatCurrency(prudentRevenue)}</strong>
        </div>
        <div className="stat-card">
          <span>CA optimiste</span>
          <strong>{formatCurrency(optimisticRevenue)}</strong>
        </div>
        <div className="stat-card">
          <span>Relances 21j</span>
          <strong>{followUpCount}</strong>
        </div>
      </section>

      <CandidateTable candidates={candidates} />
    </div>
  );
}
