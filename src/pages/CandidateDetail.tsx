import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssistantDossier } from "../components/projection/AssistantDossier";
import { AidCard } from "../components/projection/AidCard";
import { ProjectionSummary } from "../components/projection/ProjectionSummary";
import { formatCurrency } from "../lib/format";
import { projectCandidate } from "../lib/projectionEngine";
import { deleteCandidateRemote, fetchCandidate, logCandidateEvent } from "../lib/candidatesRepo";
import { useAuth } from "../lib/auth";
import type { Candidate } from "../types/candidate";

export function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchCandidate(id).then((c) => {
      setCandidate(c);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="page"><p>Chargement…</p></div>;
  if (!candidate) {
    return (
      <div className="page">
        <h2>Candidat introuvable</h2>
        <Link to="/">Retour dashboard</Link>
      </div>
    );
  }

  const projection = projectCandidate(candidate);
  const breakdown = projection.financialBreakdown;
  const forecast = projection.businessForecast;
  const diagnostic = projection.diagnostic;

  async function handleDelete() {
    if (!candidate || !user) return;
    if (!confirm("Supprimer ce candidat ?")) return;
    await logCandidateEvent(candidate.id, user.id, "deleted");
    await deleteCandidateRemote(candidate.id);
    navigate("/");
  }

  return (
    <div className="page">
      <header className="page-header print-hidden">
        <div>
          <p className="eyebrow">Fiche projection</p>
          <h2>{candidate.firstName} {candidate.lastName}</h2>
          <p>{candidate.trainingName}</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={() => window.print()}>Imprimer / PDF</button>
          <Link className="button secondary" to={`/candidats/${candidate.id}/edit`}>Modifier</Link>
          <button className="danger" onClick={handleDelete}>Supprimer</button>
        </div>
      </header>

      <ProjectionSummary candidate={candidate} projection={projection} />
      <AssistantDossier projection={projection} />

      <section className="panel">
        <h3>Diagnostic dossier</h3>
        <dl className="breakdown">
          <div><dt>Financeur prioritaire</dt><dd>{diagnostic.primaryPath}</dd></div>
          <div><dt>Statut administratif</dt><dd><span className={`pill ${diagnostic.displayTone === "danger" ? "aide_limitee" : diagnostic.displayTone === "warning" ? "financement_partiel" : diagnostic.displayTone === "success" ? "prioritaire" : "a_completer"}`}>{diagnostic.displayLabel}</span></dd></div>
          <div className="total"><dt>Prochaine action</dt><dd>{diagnostic.recommendedNextStep}</dd></div>
        </dl>
        {diagnostic.blockingIssues.length > 0 && (
          <>
            <h3>Blocages</h3>
            <ul className="clean-list warning-list">
              {diagnostic.blockingIssues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </>
        )}
        {diagnostic.calendarWarnings.length > 0 && (
          <>
            <h3>Alertes calendrier</h3>
            <ul className="clean-list warning-list">
              {diagnostic.calendarWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </>
        )}
        {diagnostic.paymentWarnings.length > 0 && (
          <>
            <h3>Alertes paiement</h3>
            <ul className="clean-list warning-list">
              {diagnostic.paymentWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </>
        )}
      </section>

      <section className="two-columns">
        <div className="panel">
          <h3>Projection financiere</h3>
          <dl className="breakdown">
            <div><dt>Cout formation</dt><dd>{formatCurrency(breakdown.trainingCost)}</dd></div>
            <div><dt>CPF estime</dt><dd>{formatCurrency(breakdown.cpfEstimated)}</dd></div>
            <div><dt>Participation forfaitaire CPF (150 EUR)</dt><dd>{breakdown.cpfFlatFeeApplied ? "Oui" : "Non"}</dd></div>
            {breakdown.cpfFlatFeeNote ? <div><dt>Note CPF</dt><dd>{breakdown.cpfFlatFeeNote}</dd></div> : null}
            <div><dt>Aides probables</dt><dd>{formatCurrency(breakdown.aidEstimated)}</dd></div>
            <div><dt>Cofinancement employeur</dt><dd>{formatCurrency(breakdown.employerEstimated)}</dd></div>
            <div><dt>Budget personnel</dt><dd>{formatCurrency(breakdown.personalBudget)}</dd></div>
            <div className="total"><dt>Reste estime</dt><dd>{formatCurrency(breakdown.estimatedRemainingCost)}</dd></div>
          </dl>
        </div>
        <div className="panel">
          <h3>CA previsionnel</h3>
          <dl className="breakdown">
            <div><dt>Scenario prudent</dt><dd>{formatCurrency(forecast.prudentRevenue)}</dd></div>
            <div><dt>Scenario optimiste</dt><dd>{formatCurrency(forecast.optimisticRevenue)}</dd></div>
            <div><dt>Diagnostic</dt><dd>{forecast.suggestedPath}</dd></div>
            <div className="total"><dt>Relance 21 jours</dt><dd>{forecast.followUpDue ? "A relancer" : "RAS"}</dd></div>
          </dl>
        </div>
      </section>

      <section className="panel">
        <h3>Actions recommandees</h3>
        <ul className="clean-list">
          {projection.recommendedActions.map((a) => <li key={a}>{a}</li>)}
        </ul>
        {projection.missingFields.length > 0 && (
          <>
            <h3>Informations manquantes</h3>
            <ul className="clean-list warning-list">
              {projection.missingFields.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <h3>Aides detectees</h3>
        <div className="aid-grid">
          {projection.aids.map((aid) => <AidCard key={aid.id} aid={aid} />)}
        </div>
      </section>

      <section className="two-columns">
        <div className="panel">
          <h3>Alertes</h3>
          <ul className="clean-list warning-list">
            {projection.warnings.length > 0 ? projection.warnings.map((w) => <li key={w}>{w}</li>) : <li>Aucune alerte majeure.</li>}
          </ul>
        </div>
        <div className="panel">
          <h3>Compatibilites</h3>
          <ul className="clean-list">
            {projection.compatibilityNotes.length > 0
              ? projection.compatibilityNotes.map((n) => <li key={n}>{n}</li>)
              : <li>Aucune note de cumul specifique.</li>}
          </ul>
        </div>
      </section>

      <p className="legal-note">
        Cette projection est indicative et ne constitue pas une decision officielle de financement.
      </p>
    </div>
  );
}
