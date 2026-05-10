import { ArrowRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "../../lib/format";
import { projectCandidate } from "../../lib/projectionEngine";
import { useAuth } from "../../lib/auth";
import type { Candidate, PipelineStatus } from "../../types/candidate";

type CandidateTableProps = {
  candidates: Candidate[];
};

const priorityLabel = {
  prioritaire: "Prioritaire",
  financement_partiel: "Partiel",
  aide_limitee: "Aide limitée",
  a_completer: "À compléter",
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

export function CandidateTable({ candidates }: CandidateTableProps) {
  const { user } = useAuth();
  const rows = candidates
    .map((candidate) => ({ candidate, projection: projectCandidate(candidate) }))
    .sort((a, b) => b.projection.financingScore - a.projection.financingScore);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-4">
          <Inbox size={32} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">Aucun candidat pour le moment</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-md">
          Ajoutez un candidat ou importez les données de démonstration depuis les paramètres pour voir les projections.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/50">
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Nom / formation</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Avancement</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Financement</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Priorité</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Diagnostic</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">CA prudent</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Reste</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Relance</th>
            <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-zinc-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rows.map(({ candidate, projection }) => (
            <tr key={candidate.id} className="transition-colors hover:bg-zinc-50/80">
              <td className="px-5 py-4">
                <div className="flex flex-col items-start gap-1">
                  <strong className="text-sm font-bold text-zinc-900">
                    {candidate.firstName} {candidate.lastName}
                  </strong>
                  {(candidate.ownerId === user?.id || candidate.assignedTo === user?.id) && (
                    <span className="inline-flex items-center rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
                      Mon dossier
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-500 mt-0.5">{candidate.email}</span>
                  <span className="text-[11px] text-indigo-600 font-medium mt-0.5 truncate max-w-[200px]">{candidate.trainingName}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <span 
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${
                    pipelineStatusLabel[candidate.pipelineStatus || "nouveau"].className
                  }`}
                >
                  {pipelineStatusLabel[candidate.pipelineStatus || "nouveau"].label}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col gap-1.5 w-32">
                  <div className="flex justify-between items-end">
                    <strong className="text-sm font-bold text-zinc-900">{projection.financingScore}%</strong>
                    <span className="text-[10px] text-zinc-500">Compl. {projection.completionScore}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className={`h-full rounded-full ${
                        projection.financingScore >= 70 ? "bg-emerald-500" : projection.financingScore >= 40 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, projection.financingScore))}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span 
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${
                    projection.priority === "prioritaire"
                      ? "bg-emerald-100 text-emerald-800"
                      : projection.priority === "financement_partiel"
                      ? "bg-amber-100 text-amber-800"
                      : projection.priority === "aide_limitee"
                      ? "bg-red-100 text-red-800"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {priorityLabel[projection.priority]}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-700">{projection.diagnostic.primaryPath}</span>
                  <span className="text-[11px] text-zinc-500 mt-0.5 capitalize">{candidate.status.replace(/_/g, " ")}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm font-semibold text-zinc-900">{formatCurrency(projection.businessForecast.prudentRevenue)}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm font-semibold text-zinc-900">{formatCurrency(projection.estimatedRemainingCost)}</span>
              </td>
              <td className="px-5 py-4">
                {projection.businessForecast.followUpDue ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold leading-none text-red-800">
                    À relancer
                  </span>
                ) : (
                  <span className="text-zinc-400 font-bold">-</span>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] text-zinc-500">{formatDate(candidate.createdAt)}</span>
                  <Link 
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-indigo-600 transition-colors hover:bg-indigo-50 hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm" 
                    to={`/candidats/${candidate.id}`} 
                    aria-label="Ouvrir la fiche"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
