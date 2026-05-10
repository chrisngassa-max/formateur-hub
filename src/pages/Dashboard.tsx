import { AlertTriangle, Clock3, Euro, FileWarning, Search, Settings, TrendingUp, UserPlus, Users, Briefcase, Download, LayoutGrid, List } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { CandidateTable } from "../components/dashboard/CandidateTable";
import { CandidateCards } from "../components/dashboard/CandidateCards";
import { formatCurrency } from "../lib/format";
import { projectCandidate } from "../lib/projectionEngine";
import { useCandidates } from "./useCandidates";
import { useAuth } from "../lib/auth";
import { CandidateKanban } from "../components/dashboard/CandidateKanban";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { fetchProfiles, UserProfile } from "../lib/profilesRepo";
import { downloadCandidatesCsv } from "../lib/exportCsv";

export function Dashboard() {
  const { candidates, loading, error, refresh } = useCandidates();
  const { user, isAdmin } = useAuth();
  const [filterMode, setFilterMode] = useState<"tous" | "mes_dossiers" | "non_assignes" | "prioritaires" | "relances">("tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tableau" | "pipeline">("tableau");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    fetchProfiles().then(setProfiles);
  }, []);

  // Memoized filtered candidates
  const processedData = useMemo(() => {
    let filtered = candidates.filter((c) => {
      const isOwner = c.ownerId === user?.id || c.assignedTo === user?.id;
      if (filterMode === "mes_dossiers") return isOwner;
      if (filterMode === "non_assignes") return !c.assignedTo;
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.firstName.toLowerCase().includes(q) || 
        c.lastName.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) ||
        (c.trainingName && c.trainingName.toLowerCase().includes(q))
      );
    }

    let projs = filtered.map(projectCandidate);

    if (filterMode === "prioritaires") {
      projs = projs.filter((p) => p.priority === "prioritaire");
    } else if (filterMode === "relances") {
      projs = projs.filter((p) => p.businessForecast.followUpDue);
    }

    const finalCandidates = projs.map(p => filtered.find(c => c.id === p.id)!);

    return { filtered: finalCandidates, projections: projs };
  }, [candidates, filterMode, searchQuery, user]);

  const { filtered: filteredCandidates, projections } = processedData;

  // KPIs
  const myCandidates = candidates.filter(c => c.ownerId === user?.id || c.assignedTo === user?.id);
  const myProjections = myCandidates.map(projectCandidate);
  
  const priorityCount = isAdmin 
    ? projections.filter((p) => p.priority === "prioritaire").length
    : myProjections.filter((p) => p.priority === "prioritaire").length;

  const followUpCount = isAdmin
    ? projections.filter((p) => p.businessForecast.followUpDue).length
    : myProjections.filter((p) => p.businessForecast.followUpDue).length;
    
  const unassignedCount = candidates.filter(c => !c.assignedTo && !c.ownerId).length;
  const incompleteCount = projections.filter((p) => p.priority === "a_completer").length;
  const blockedCount = projections.filter((p) => p.diagnostic.readinessStatus === "bloque").length;
  const urgentCount = projections.filter((p) => p.diagnostic.readinessStatus === "urgent").length;
  const prudentRevenue = projections.reduce((t, p) => t + p.businessForecast.prudentRevenue, 0);
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
            {isAdmin 
              ? "Vue d'ensemble du pipeline et des performances du cabinet." 
              : "Suivi opérationnel de vos dossiers et relances à effectuer."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            to="/parametres"
          >
            <Settings size={16} />
            Paramètres
          </Link>
          <button
            onClick={() => downloadCandidatesCsv(filteredCandidates, projections, profiles)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Download size={16} />
            Exporter CSV
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            to="/candidats/nouveau"
          >
            <UserPlus size={16} />
            Nouveau candidat
          </Link>
        </div>
      </header>

      {/* Recherche et Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterMode("tous")}
            className={`whitespace-nowrap inline-flex h-8 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              filterMode === "tous" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Users size={14} />
            Tous
          </button>
          <button
            onClick={() => setFilterMode("mes_dossiers")}
            className={`whitespace-nowrap inline-flex h-8 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              filterMode === "mes_dossiers" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Mes dossiers ({myCandidates.length})
          </button>
          <button
            onClick={() => setFilterMode("non_assignes")}
            className={`whitespace-nowrap inline-flex h-8 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              filterMode === "non_assignes" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Non assignés
          </button>
          <button
            onClick={() => setFilterMode("prioritaires")}
            className={`whitespace-nowrap inline-flex h-8 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              filterMode === "prioritaires" ? "bg-amber-600 text-white shadow-sm" : "text-zinc-600 hover:bg-amber-50 hover:text-amber-700"
            }`}
          >
            Prioritaires
          </button>
          <button
            onClick={() => setFilterMode("relances")}
            className={`whitespace-nowrap inline-flex h-8 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              filterMode === "relances" ? "bg-red-600 text-white shadow-sm" : "text-zinc-600 hover:bg-red-50 hover:text-red-700"
            }`}
          >
            Mes relances du jour
          </button>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Rechercher un candidat..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          Erreur : {error}
        </div>
      )}

      {loading && <DashboardSkeleton />}

      {!loading && !error && (
        <>
          {/* KPIs dynamiques par rôle */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicateurs principaux">
        
        {/* KPI 1 : Vue Admin vs Conseiller */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600"></div>
          <div className="flex items-start justify-between p-5">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                {isAdmin ? "Total dossiers actifs" : "Mes dossiers actifs"}
              </span>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                {isAdmin ? candidates.length : myCandidates.length}
              </strong>
              <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                {isAdmin ? "Sur toute l'équipe" : "Assignés ou créés par vous"}
              </small>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              {isAdmin ? <Users size={20} /> : <Briefcase size={20} />}
            </div>
          </div>
        </div>

        {/* KPI 2 : Prioritaires */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
          <div className="flex items-start justify-between p-5">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                {isAdmin ? "Prioritaires globaux" : "Mes priorités"}
              </span>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                {priorityCount}
              </strong>
              <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                Financement &gt; 70%
              </small>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* KPI 3 : Relances */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-red-500"></div>
          <div className="flex items-start justify-between p-5">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                {isAdmin ? "Relances en retard" : "Mes relances du jour"}
              </span>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                {followUpCount}
              </strong>
              <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                Actions échues
              </small>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Clock3 size={20} />
            </div>
          </div>
        </div>

        {/* KPI 4 : Admin = CA, Conseiller = Bloqués */}
        {isAdmin ? (
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-violet-600"></div>
            <div className="flex items-start justify-between p-5">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  CA pondéré (équipe)
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
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm pt-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
            <div className="flex items-start justify-between p-5">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Mes dossiers incomplets
                </span>
                <strong className="mt-2 block text-3xl font-bold tracking-tight text-zinc-900">
                  {incompleteCount}
                </strong>
                <small className="mt-2 block text-xs text-zinc-500 leading-snug">
                  Pièces ou infos manquantes
                </small>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FileWarning size={20} />
              </div>
            </div>
          </div>
        )}
      </section>

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
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-zinc-900">Pipeline candidats</h3>
            <p className="mt-1 text-sm text-zinc-500 hidden sm:block">Vos actions et priorités en un clin d'œil.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1">
              <button
                onClick={() => setViewMode("tableau")}
                className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "tableau" ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <List size={14} className="mr-1.5" />
                Tableau
              </button>
              <button
                onClick={() => setViewMode("pipeline")}
                className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "pipeline" ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <LayoutGrid size={14} className="mr-1.5" />
                Pipeline
              </button>
            </div>
            <span className="text-sm font-semibold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full">
              {filteredCandidates.length} dossier(s) affiché(s)
            </span>
          </div>
        </div>
        
        {filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-zinc-200 bg-zinc-50 border-dashed">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Search className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">Aucun dossier trouvé</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              {searchQuery 
                ? `Aucun résultat pour la recherche "${searchQuery}".`
                : "Il n'y a aucun dossier correspondant à ce filtre pour le moment."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Cards version mobile */}
            <div className="block md:hidden rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <CandidateCards candidates={filteredCandidates} profiles={profiles} />
            </div>

            {/* Table/Kanban version desktop */}
            <div className="hidden md:block rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              {viewMode === "pipeline" ? (
                <CandidateKanban candidates={filteredCandidates} profiles={profiles} onCandidateUpdate={refresh} />
              ) : (
                <CandidateTable candidates={filteredCandidates} profiles={profiles} />
              )}
            </div>
          </>
        )}
      </section>
      </>
      )}
    </div>
  );
}
