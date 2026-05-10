import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssistantDossier } from "../components/projection/AssistantDossier";
import { AidCard } from "../components/projection/AidCard";
import { ProjectionSummary } from "../components/projection/ProjectionSummary";
import { formatCurrency } from "../lib/format";
import { projectCandidate } from "../lib/projectionEngine";
import { deleteCandidateRemote, fetchCandidate, logCandidateEvent, upsertCandidateRemote } from "../lib/candidatesRepo";
import { useAuth } from "../lib/auth";
import type { Candidate } from "../types/candidate";
import { ArrowLeft, Printer, Edit2, Trash2, AlertCircle, Calendar, CreditCard, ChevronRight, User, ChevronRight as ChevronRightIcon } from "lucide-react";
import { CandidatePipeline } from "../components/candidate/CandidatePipeline";
import { AdminReassignModal } from "../components/candidate/AdminReassignModal";
import { CandidateEventsList } from "../components/candidate/CandidateEventsList";

export function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReassignModal, setShowReassignModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCandidate(id).then((c) => {
      setCandidate(c);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-zinc-500 animate-pulse">Chargement…</div>;
  if (!candidate) {
    return (
      <div className="p-8 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-zinc-900">Candidat introuvable</h2>
        <Link to="/" className="text-indigo-600 hover:underline flex items-center gap-2 w-fit">
          <ArrowLeft size={16} /> Retour dashboard
        </Link>
      </div>
    );
  }

  const projection = projectCandidate(candidate);
  const breakdown = projection.financialBreakdown;
  const forecast = projection.businessForecast;
  const diagnostic = projection.diagnostic;

  async function handleDelete() {
    if (!candidate || !user || !isAdmin) return;
    if (!confirm("Voulez-vous vraiment supprimer ce candidat ? Cette action est irréversible.")) return;
    await logCandidateEvent(candidate.id, user.id, "deleted");
    await deleteCandidateRemote(candidate.id);
    navigate("/");
  }

  async function handleUpdateCandidate(updated: Candidate) {
    if (!user) return;
    try {
      const saved = await upsertCandidateRemote(updated, updated.ownerId || user.id);
      setCandidate(saved);
    } catch (err) {
      console.error("Failed to update candidate", err);
      alert("Erreur lors de la mise à jour du dossier.");
    }
  }

  async function handleReassign(newUserId: string | undefined) {
    if (!candidate || !user) return;
    try {
      const updated = { ...candidate, assignedTo: newUserId };
      await upsertCandidateRemote(updated, updated.ownerId || user.id);
      await logCandidateEvent(candidate.id, user.id, "system", `Dossier réassigné à ${newUserId || "Non assigné"}`);
      setCandidate(updated);
      setShowReassignModal(false);
    } catch (err) {
      console.error("Failed to reassign", err);
      alert("Erreur lors de la réassignation.");
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 mb-4">
            <Link to="/" className="hover:text-zinc-900 transition-colors">Dashboard</Link>
            <ChevronRightIcon size={12} className="text-zinc-300" />
            <Link to="/" className="hover:text-zinc-900 transition-colors">Candidats</Link>
            <ChevronRightIcon size={12} className="text-zinc-300" />
            <span className="text-zinc-900">{candidate.firstName} {candidate.lastName}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
              diagnostic.displayTone === "danger" ? "bg-red-100 text-red-800" 
              : diagnostic.displayTone === "warning" ? "bg-amber-100 text-amber-800" 
              : diagnostic.displayTone === "success" ? "bg-emerald-100 text-emerald-800" 
              : "bg-blue-100 text-blue-800"
            }`}>
              {diagnostic.displayLabel}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {candidate.trainingName || "Formation à préciser"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 sm:mt-8">
          <button 
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            onClick={() => window.print()}
          >
            <Printer size={14} /> Imprimer / PDF
          </button>
          <Link 
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            to={`/candidats/${candidate.id}/edit`}
          >
            <Edit2 size={14} /> Modifier
          </Link>
          {isAdmin && (
            <>
              <button 
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                onClick={() => setShowReassignModal(true)}
              >
                <User size={14} /> Réassigner
              </button>
              <button 
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500" 
                onClick={handleDelete}
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </>
          )}
        </div>
      </header>

      {/* Navigation Ancrée */}
      <nav className="flex items-center gap-6 border-b border-zinc-200 pb-2 mb-2 print:hidden overflow-x-auto text-sm font-semibold text-zinc-500">
        <a href="#synthese" className="hover:text-indigo-600 transition-colors whitespace-nowrap">Synthèse</a>
        <a href="#pipeline" className="hover:text-indigo-600 transition-colors whitespace-nowrap">Pipeline</a>
        <a href="#diagnostic" className="hover:text-indigo-600 transition-colors whitespace-nowrap">Diagnostic</a>
        <a href="#plan-action" className="hover:text-indigo-600 transition-colors whitespace-nowrap">Plan d'action</a>
        <a href="#aides" className="hover:text-indigo-600 transition-colors whitespace-nowrap">Aides détectées</a>
        <a href="#historique" className="hover:text-indigo-600 transition-colors whitespace-nowrap">Historique</a>
      </nav>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div id="synthese">
            <ProjectionSummary candidate={candidate} projection={projection} />
          </div>
          
          <div id="pipeline">
            <CandidatePipeline candidate={candidate} onUpdate={handleUpdateCandidate} />
          </div>

          {/* Diagnostic Dossier */}
          <section id="diagnostic" className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <AlertCircle size={18} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Diagnostic du dossier</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-xs font-semibold uppercase text-zinc-500">Financeur prioritaire</span>
                <strong className="text-sm text-zinc-900 mt-1">{diagnostic.primaryPath}</strong>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-xs font-semibold uppercase text-zinc-500">Statut administratif</span>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                    diagnostic.displayTone === "danger" ? "bg-red-100 text-red-800" 
                    : diagnostic.displayTone === "warning" ? "bg-amber-100 text-amber-800" 
                    : diagnostic.displayTone === "success" ? "bg-emerald-100 text-emerald-800" 
                    : "bg-blue-100 text-blue-800"
                  }`}>
                    {diagnostic.displayLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-xs font-semibold uppercase text-indigo-600">Prochaine action</span>
                <strong className="text-sm text-indigo-900 mt-1">{diagnostic.recommendedNextStep}</strong>
              </div>
            </div>

            {(diagnostic.blockingIssues.length > 0 || diagnostic.calendarWarnings.length > 0 || diagnostic.paymentWarnings.length > 0) && (
              <div className="mt-4 flex flex-col gap-4 border-t border-zinc-100 pt-6">
                {diagnostic.blockingIssues.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-bold text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} /> Blocages majeurs
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {diagnostic.blockingIssues.map((issue) => (
                        <li key={issue} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 border border-red-100">
                          <span className="mt-0.5">•</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {diagnostic.calendarWarnings.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <h4 className="text-sm font-bold text-amber-600 flex items-center gap-2">
                      <Calendar size={16} /> Alertes calendrier
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {diagnostic.calendarWarnings.map((warning) => (
                        <li key={warning} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 border border-amber-100">
                          <span className="mt-0.5">•</span> {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {diagnostic.paymentWarnings.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <h4 className="text-sm font-bold text-amber-600 flex items-center gap-2">
                      <CreditCard size={16} /> Alertes paiement
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {diagnostic.paymentWarnings.map((warning) => (
                        <li key={warning} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 border border-amber-100">
                          <span className="mt-0.5">•</span> {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Action Plan */}
          <section id="plan-action" className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold text-zinc-900">Plan d'action</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-600">Actions recommandées</h4>
                <ul className="flex flex-col gap-2">
                  {projection.recommendedActions.length > 0 ? (
                    projection.recommendedActions.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm text-zinc-700">
                        <ChevronRight size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-zinc-500 italic">Aucune action spécifique.</li>
                  )}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-600">Informations manquantes</h4>
                <ul className="flex flex-col gap-2">
                  {projection.missingFields.length > 0 ? (
                    projection.missingFields.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                        <span>{f}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-zinc-500 italic">Dossier complet.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Aids Detectees */}
          <section id="aides" className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 bg-gradient-to-br from-white to-zinc-50/50">
            <h3 className="text-lg font-bold text-zinc-900">Aides détectées</h3>
            {projection.aids.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
                {projection.aids.map((aid) => <AidCard key={aid.id} aid={aid} />)}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">Aucune aide spécifique détectée pour ce profil.</p>
            )}
          </section>

          {/* Warnings & Compat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900">Alertes réglementaires</h3>
              <ul className="flex flex-col gap-2 mt-1">
                {projection.warnings.length > 0 ? (
                  projection.warnings.map((w) => (
                    <li key={w} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">Aucune alerte majeure.</li>
                )}
              </ul>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900">Notes de compatibilité</h3>
              <ul className="flex flex-col gap-2 mt-1">
                {projection.compatibilityNotes.length > 0 ? (
                  projection.compatibilityNotes.map((n) => (
                    <li key={n} className="flex items-start gap-2 text-sm text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <span className="mt-1 shrink-0 w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                      <span>{n}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-zinc-500 italic p-3">Aucune note de cumul spécifique.</li>
                )}
              </ul>
            </section>
          </div>

          {/* Historique */}
          <section id="historique" className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-bold text-zinc-900">Historique du dossier</h3>
            </div>
            <CandidateEventsList candidateId={candidate.id} />
          </section>
        </div>

        {/* Right Column (Sticky) */}
        <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-24">
          <AssistantDossier projection={projection} />
          
          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">Détail financier</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Coût formation</span>
                <span className="font-mono text-sm font-semibold">{formatCurrency(breakdown.trainingCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">CPF estimé</span>
                <span className="font-mono text-sm font-semibold">{formatCurrency(breakdown.cpfEstimated)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Participation CPF (100€)</span>
                <span className="text-sm font-medium">{breakdown.cpfFlatFeeApplied ? "Oui" : "Non"}</span>
              </div>
              {breakdown.cpfFlatFeeNote && (
                <div className="rounded bg-zinc-50 p-2 text-xs text-zinc-500 italic mb-1">{breakdown.cpfFlatFeeNote}</div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Aides probables</span>
                <span className="font-mono text-sm font-semibold text-emerald-600">{formatCurrency(breakdown.aidEstimated)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Cofinancement employeur</span>
                <span className="font-mono text-sm font-semibold text-emerald-600">{formatCurrency(breakdown.employerEstimated)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Budget personnel</span>
                <span className="font-mono text-sm font-semibold">{formatCurrency(breakdown.personalBudget)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm font-medium text-zinc-900">Reste à charge prudent</span>
                <span className="font-mono text-sm font-bold text-zinc-900">{formatCurrency(breakdown.estimatedRemainingCost)}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1 rounded-xl bg-indigo-50 p-4 border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-indigo-900">Reste potentiel (après OPCO)</span>
                  <span className="font-mono text-lg font-bold text-indigo-700">{formatCurrency(forecast.expectedRemainingCost)}</span>
                </div>
                {forecast.expectedRemainingCost < breakdown.estimatedRemainingCost && (
                  <span className="text-xs text-indigo-600/80 italic text-right mt-1">
                    * sous réserve de validation
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">Prévisions Commerciales</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Scénario prudent</span>
                <span className="font-mono text-base font-bold text-zinc-900">{formatCurrency(forecast.prudentRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Scénario moyen</span>
                <span className="font-mono text-base font-bold text-indigo-600">{formatCurrency(forecast.averageRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                <span className="text-sm text-zinc-600">Scénario optimiste</span>
                <span className="font-mono text-base font-bold text-emerald-600">{formatCurrency(forecast.optimisticRevenue)}</span>
              </div>
              <div className="flex flex-col gap-2 py-3 border-b border-zinc-50">
                <span className="text-xs font-semibold uppercase text-zinc-500">Diagnostic</span>
                <span className="text-sm font-medium text-zinc-800">{forecast.suggestedPath}</span>
              </div>
              <div className="mt-auto pt-4">
                <div className={`flex items-center justify-between rounded-xl p-4 border ${forecast.followUpDue ? 'bg-amber-50 border-amber-200' : 'bg-zinc-50 border-zinc-100'}`}>
                  <span className={`text-sm font-bold ${forecast.followUpDue ? 'text-amber-800' : 'text-zinc-600'}`}>Relance 21 jours</span>
                  <span className={`text-sm font-bold ${forecast.followUpDue ? 'text-amber-700' : 'text-zinc-500'}`}>{forecast.followUpDue ? "Action requise" : "RAS"}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <p className="text-center text-xs text-zinc-400 mt-4 pb-8 print:hidden">
        Cette projection est indicative et ne constitue pas une décision officielle de financement.
      </p>

      {showReassignModal && candidate && (
        <AdminReassignModal 
          candidate={candidate} 
          onClose={() => setShowReassignModal(false)}
          onAssign={handleReassign}
        />
      )}
    </div>
  );
}
