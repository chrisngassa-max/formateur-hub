import { ArrowRight, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { formatCurrency } from "../../lib/format";
import { projectCandidate } from "../../lib/projectionEngine";
import { useAuth } from "../../lib/auth";
import type { Candidate, PipelineStatus } from "../../types/candidate";
import type { UserProfile } from "../../lib/profilesRepo";

type CandidateTableProps = {
  candidates: Candidate[];
  profiles: UserProfile[];
};

const pipelineStatusLabel: Record<PipelineStatus, { label: string; className: string }> = {
  nouveau: { label: "Nouveau", className: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", className: "bg-indigo-100 text-indigo-800" },
  en_attente_candidat: { label: "Attente cand.", className: "bg-amber-100 text-amber-800" },
  pret_a_deposer: { label: "Prêt à déposer", className: "bg-emerald-100 text-emerald-800" },
  depose: { label: "Déposé", className: "bg-purple-100 text-purple-800" },
  gagne: { label: "Gagné", className: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  perdu: { label: "Perdu", className: "bg-red-100 text-red-800" },
  abandonne: { label: "Abandonné", className: "bg-zinc-100 text-zinc-600" },
  archive: { label: "Archivé", className: "bg-zinc-100 text-zinc-600" },
};

export function CandidateTable({ candidates, profiles }: CandidateTableProps) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const allRows = candidates
    .map((candidate) => ({ candidate, projection: projectCandidate(candidate) }))
    .sort((a, b) => b.projection.financingScore - a.projection.financingScore);

  const totalPages = Math.ceil(allRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const rows = allRows.slice(startIndex, startIndex + itemsPerPage);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-zinc-200 rounded-xl bg-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-4">
          <Inbox size={32} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">Aucun candidat</h3>
        <p className="mt-1 text-sm text-zinc-500">Ajoutez un premier candidat pour voir les projections.</p>
        <Link
          to="/candidats/nouveau"
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Nouveau candidat
        </Link>
      </div>
    );
  }

  function getAssigneeBadge(candidate: Candidate) {
    if (candidate.assignedTo === user?.id || candidate.ownerId === user?.id) {
      return (
        <span className="inline-flex items-center rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
          Mon dossier
        </span>
      );
    }
    if (!candidate.assignedTo) {
      return (
        <span className="inline-flex items-center rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 ring-1 ring-inset ring-zinc-500/20">
          Non assigné
        </span>
      );
    }
    const profile = profiles.find(p => p.id === candidate.assignedTo);
    const name = profile ? (profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.email) : "Conseiller";
    return (
      <span className="inline-flex items-center rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 ring-1 ring-inset ring-slate-500/20">
        {name}
      </span>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-4 py-3">Candidat</th>
            <th className="px-4 py-3">Formation & Statut</th>
            <th className="px-4 py-3">Financement</th>
            <th className="px-4 py-3">Prochaine action</th>
            <th className="px-4 py-3">Relance</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map(({ candidate, projection }) => {
            const isFollowUpDue = projection.businessForecast.followUpDue;
            
            return (
            <tr 
              key={candidate.id} 
              className={`transition-colors ${isFollowUpDue ? 'bg-amber-50/40 hover:bg-amber-100/50' : 'hover:bg-zinc-50/50'}`}
            >
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <strong className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">
                    {candidate.firstName} {candidate.lastName}
                  </strong>
                  <div>{getAssigneeBadge(candidate)}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-indigo-600 truncate max-w-[200px]">
                    {candidate.trainingName || "Non spécifiée"}
                  </span>
                  <span className={`w-fit inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${pipelineStatusLabel[candidate.pipelineStatus || "nouveau"].className}`}>
                    {pipelineStatusLabel[candidate.pipelineStatus || "nouveau"].label}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-zinc-900">{formatCurrency(projection.estimatedRemainingCost)} RAC</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-zinc-100 overflow-hidden">
                      <div 
                        className={`h-full ${projection.financingScore > 70 ? 'bg-emerald-500' : projection.financingScore > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${projection.financingScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500">{projection.financingScore}%</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-zinc-600 truncate max-w-[250px] inline-block">
                  {projection.diagnostic.recommendedNextStep}
                </span>
              </td>
              <td className="px-4 py-3">
                {isFollowUpDue ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      À relancer
                    </span>
                    {projection.businessForecast.followUpAt && (
                      <span className="text-[10px] text-amber-600">
                        {new Date(projection.businessForecast.followUpAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400">RAS</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/candidats/${candidate.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-indigo-600 shadow-sm hover:bg-indigo-50 hover:border-indigo-200"
                  aria-label={`Ouvrir la fiche de ${candidate.firstName}`}
                >
                  <ArrowRight size={16} />
                </Link>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="flex items-center text-sm text-zinc-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-700">
                Affichage de <span className="font-bold">{startIndex + 1}</span> à <span className="font-bold">{Math.min(startIndex + itemsPerPage, allRows.length)}</span> sur <span className="font-bold">{allRows.length}</span> résultats
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                      currentPage === i + 1
                        ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        : "text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
