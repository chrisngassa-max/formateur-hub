import { AlertTriangle, Clock3, Euro, FileWarning, Settings, TrendingUp, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CandidateTable } from "../components/dashboard/CandidateTable";
import { formatCurrency } from "../lib/format";
import { projectCandidate } from "../lib/projectionEngine";
import { useCandidates } from "./useCandidates";
import { useAuth } from "../lib/auth";

export function Dashboard() {
  const { candidates, loading, error } = useCandidates();
  const { user, isAdmin } = useAuth();
  const [showAll, setShowAll] = useState(true); // admin voit tous par défaut, conseiller voit ses dossiers

  // Filtrage : un conseiller ne voit que ses dossiers; un admin peut basculer
  const filteredCandidates = isAdmin && !showAll
    ? candidates.filter((c) => c.ownerId === user?.id)
    : !isAdmin
    ? candidates.filter((c) => c.ownerId === user?.id)
    : candidates;

  const projections = filteredCandidates.map(projectCandidate);
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
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Préqualification financement
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Dashboard conseiller
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Classement des candidats par potentiel de financement et complétude du dossier.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            to="/parametres"
          >
            <Settings size={16} />
            Paramètres / Import
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            to="/candidats/nouveau"
          >
            <UserPlus size={16} />
            Nouveau candidat
          </Link>
        </div>
      </header>

      {/* Filtre Admin : Mes dossiers / Tous les dossiers */}
      {isAdmin && (
        <div className="flex items-center gap-1 self-start rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setShowAll(true)}
            className={`inline-flex h-8 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              showAll ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Users size={14} />
            Tous les dossiers ({candidates.length})
          </button>
          <button
            onClick={() => setShowAll(false)}
            className={`inline-flex h-8 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              !showAll ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Mes dossiers
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          Erreur : {error}
        </div>
      )}
      {loading && <p className="text-sm text-zinc-500 animate-pulse">Chargement des candidats...</p>}
      {!loading && !isAdmin && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 self-start">
          <Users size={14} /> Vous voyez vos {filteredCandidates.length} dossier(s)
        </div>
      )}

      {/* Primary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicateurs principaux">
        
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600"></div>
          <div className="flex items-start justify-between p-5">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Candidats actifs
              </span>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                {candidates.length}
              </strong>
              <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                {priorityCount} prioritaire(s), {incompleteCount} à compléter
              </small>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
          <div className="flex items-start justify-between p-5">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Dossiers prioritaires
              </span>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                {priorityCount}
              </strong>
              <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                {incompleteCount} dossier(s) à compléter
              </small>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-600"></div>
          <div className="flex items-start justify-between p-5">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Reste moyen
              </span>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                {formatCurrency(averageRemaining)}
              </strong>
              <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                Après CPF et aides estimées
              </small>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-violet-600"></div>
          <div className="flex items-start justify-between p-5">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                CA pondéré
              </span>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                {formatCurrency(weightedRevenue)}
              </strong>
              <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                {formatCurrency(prudentRevenue)} prudent
              </small>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Euro size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* Secondary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Indicateurs secondaires">
        <div className={`relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-3 p-4`}>
          <div className={`absolute top-0 inset-x-0 h-1 ${urgentCount > 0 || blockedCount > 0 ? "bg-red-600" : "bg-blue-600"}`}></div>
          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Urgences dossier</span>
          <strong className="mt-1 block text-2xl font-bold tracking-tight text-zinc-900">{urgentCount + blockedCount}</strong>
          <small className="mt-1 block text-[11px] text-zinc-500">{urgentCount} urgent(s), {blockedCount} bloqué(s)</small>
        </div>
        
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-3 p-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">À compléter</span>
          <strong className="mt-1 block text-2xl font-bold tracking-tight text-zinc-900">{incompleteCount}</strong>
          <small className="mt-1 block text-[11px] text-zinc-500">Infos ou pièces manquantes</small>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-3 p-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-violet-600"></div>
          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">CA optimiste</span>
          <strong className="mt-1 block text-2xl font-bold tracking-tight text-zinc-900">{formatCurrency(optimisticRevenue)}</strong>
          <small className="mt-1 block text-[11px] text-zinc-500">Scénario haut des dossiers</small>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-3 p-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Relances 21j</span>
          <strong className="mt-1 block text-2xl font-bold tracking-tight text-zinc-900">{followUpCount}</strong>
          <small className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
            <Clock3 size={12} /> Dossiers à relancer
          </small>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-3 p-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-red-600"></div>
          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Bloqués</span>
          <strong className="mt-1 block text-2xl font-bold tracking-tight text-zinc-900">{blockedCount}</strong>
          <small className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
            <FileWarning size={12} /> Action requise
          </small>
        </div>
      </section>

      {/* Table Section */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Portefeuille</p>
          <h3 className="mt-1 text-xl font-bold text-zinc-900">Candidats classés par potentiel</h3>
          <p className="mt-1 text-sm text-zinc-500">Score, priorité, diagnostic et reste à charge en lecture rapide.</p>
        </div>
        
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <CandidateTable candidates={filteredCandidates} />
        </div>
      </section>
    </div>
  );
}
