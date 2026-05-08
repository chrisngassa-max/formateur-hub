import { AlertTriangle, Clock3, Euro, FileWarning, Settings, UserPlus, Users } from "lucide-react";
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
  const weightedRevenue = projections
    .filter((p) => p.diagnostic.readinessStatus !== "bloque")
    .reduce((t, p) => t + p.businessForecast.prudentRevenue * (p.financingScore / 100), 0);
  const averageRemaining = projections.reduce((t, p) => t + p.estimatedRemainingCost, 0) / Math.max(1, projections.length);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Prequalification financement</p>
          <h2>Dashboard conseiller</h2>
          <p>Classement des candidats par potentiel de financement et completude du dossier.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" to="/parametres">
            <Settings size={18} />
            Parametres / Import
          </Link>
          <Link className="button" to="/candidats/nouveau">
            <UserPlus size={18} />
            Nouveau candidat
          </Link>
        </div>
      </header>

      {error && <p className="ai-error">Erreur : {error}</p>}
      {loading && <p>Chargement des candidats...</p>}

      <section className="dashboard-lead" aria-label="Indicateurs principaux">
        <div className="stat-card featured primary">
          <div className="stat-row">
            <div>
              <span>Candidats actifs</span>
              <strong>{candidates.length}</strong>
              <small>{priorityCount} prioritaire(s), {incompleteCount} a completer</small>
            </div>
            <span className="stat-icon"><Users size={20} /></span>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-row">
            <div>
              <span>CA prudent</span>
              <strong>{formatCurrency(prudentRevenue)}</strong>
              <small>{formatCurrency(weightedRevenue)} pondere</small>
            </div>
            <span className="stat-icon"><Euro size={20} /></span>
          </div>
        </div>
        <div className={`stat-card ${urgentCount > 0 || blockedCount > 0 ? "urgent" : "info"}`}>
          <div className="stat-row">
            <div>
              <span>Urgences dossier</span>
              <strong>{urgentCount + blockedCount}</strong>
              <small>{urgentCount} urgent(s), {blockedCount} bloque(s)</small>
            </div>
            <span className="stat-icon"><AlertTriangle size={20} /></span>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Indicateurs secondaires">
        <div className="stat-card warning">
          <span>A completer</span>
          <strong>{incompleteCount}</strong>
          <small>Informations ou pieces manquantes</small>
        </div>
        <div className="stat-card info">
          <span>Reste moyen</span>
          <strong>{formatCurrency(averageRemaining)}</strong>
          <small>Apres CPF et aides estimees</small>
        </div>
        <div className="stat-card revenue">
          <span>CA optimiste</span>
          <strong>{formatCurrency(optimisticRevenue)}</strong>
          <small>Scenario haut des dossiers ouverts</small>
        </div>
        <div className="stat-card warning">
          <span>Relances 21j</span>
          <strong>{followUpCount}</strong>
          <small><Clock3 size={14} /> Dossiers a relancer</small>
        </div>
        <div className="stat-card danger">
          <span>Bloques</span>
          <strong>{blockedCount}</strong>
          <small><FileWarning size={14} /> Action requise</small>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Portefeuille</p>
          <h3>Candidats classes par potentiel</h3>
          <p>Score, priorite, diagnostic et reste a charge en lecture rapide.</p>
        </div>
      </section>

      <CandidateTable candidates={candidates} />
    </div>
  );
}
