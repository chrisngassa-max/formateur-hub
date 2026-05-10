import { ArrowRight, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../lib/format";
import { projectCandidate } from "../../lib/projectionEngine";
import { useAuth } from "../../lib/auth";
import type { Candidate, PipelineStatus } from "../../types/candidate";
import type { UserProfile } from "../../lib/profilesRepo";
import { logCandidateEvent, upsertCandidateRemote } from "../../lib/candidatesRepo";

type CandidateKanbanProps = {
  candidates: Candidate[];
  profiles: UserProfile[];
  onCandidateUpdate: (candidate: Candidate) => void;
};

const pipelineColumns: { id: PipelineStatus; label: string; className: string }[] = [
  { id: "nouveau", label: "Nouveau", className: "bg-blue-50 border-blue-200" },
  { id: "en_cours", label: "En cours", className: "bg-indigo-50 border-indigo-200" },
  { id: "en_attente_candidat", label: "Attente cand.", className: "bg-amber-50 border-amber-200" },
  { id: "pret_a_deposer", label: "Prêt à déposer", className: "bg-emerald-50 border-emerald-200" },
  { id: "depose", label: "Déposé", className: "bg-purple-50 border-purple-200" },
  { id: "gagne", label: "Gagné", className: "bg-emerald-50 border-emerald-300" },
  { id: "perdu", label: "Perdu", className: "bg-red-50 border-red-200" },
  { id: "abandonne", label: "Abandonné", className: "bg-zinc-100 border-zinc-200" },
  { id: "archive", label: "Archivé", className: "bg-zinc-100 border-zinc-200" },
];

export function CandidateKanban({ candidates, profiles, onCandidateUpdate }: CandidateKanbanProps) {
  const { user } = useAuth();

  const grouped = candidates.reduce((acc, candidate) => {
    const status = candidate.pipelineStatus || "nouveau";
    if (!acc[status]) acc[status] = [];
    acc[status].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  async function handleStatusChange(candidate: Candidate, newStatus: PipelineStatus) {
    if (!user) return;
    try {
      const updated = { ...candidate, pipelineStatus: newStatus };
      await upsertCandidateRemote(updated, updated.ownerId || user.id);
      await logCandidateEvent(candidate.id, user.id, "system", `Statut pipeline mis à jour : ${newStatus}`);
      onCandidateUpdate(updated);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut :", err);
      alert("Erreur lors de la mise à jour.");
    }
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
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {pipelineColumns.map((col) => {
        const colCandidates = grouped[col.id] || [];
        // Only show columns that are not empty, except for some core columns
        if (colCandidates.length === 0 && !["nouveau", "en_cours", "en_attente_candidat", "pret_a_deposer"].includes(col.id)) {
          return null;
        }

        return (
          <div key={col.id} className={`flex flex-col gap-3 min-w-[300px] max-w-[300px] rounded-xl border p-3 snap-start ${col.className}`}>
            <div className="flex justify-between items-center px-1">
              <h4 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">{col.label}</h4>
              <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full text-zinc-600">{colCandidates.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {colCandidates
                .map((candidate) => ({ candidate, projection: projectCandidate(candidate) }))
                .sort((a, b) => b.projection.financingScore - a.projection.financingScore)
                .map(({ candidate, projection }) => {
                  const currentIndex = pipelineColumns.findIndex(c => c.id === col.id);
                  const nextStatus = currentIndex < pipelineColumns.length - 1 ? pipelineColumns[currentIndex + 1] : null;

                  return (
                    <div key={candidate.id} className="flex flex-col gap-3 bg-white rounded-lg p-4 shadow-sm border border-zinc-100 hover:border-indigo-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <Link to={`/candidats/${candidate.id}`} className="font-bold text-sm text-indigo-900 hover:underline">
                            {candidate.firstName} {candidate.lastName}
                          </Link>
                          <span className="text-xs text-zinc-500 truncate max-w-[180px] mt-0.5">{candidate.trainingName || "Formation non spécifiée"}</span>
                        </div>
                        {projection.businessForecast.followUpDue && (
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Relance requise"></div>
                        )}
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                          {getAssigneeBadge(candidate)}
                          <span className="text-[10px] font-semibold text-zinc-600">
                            RAC : <span className="text-zinc-900 font-bold">{formatCurrency(projection.estimatedRemainingCost)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select 
                            className="text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[100px]"
                            value={col.id}
                            onChange={(e) => handleStatusChange(candidate, e.target.value as PipelineStatus)}
                          >
                            {pipelineColumns.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                          </select>
                          {nextStatus && (
                            <button
                              onClick={() => handleStatusChange(candidate, nextStatus.id)}
                              className="inline-flex h-6 items-center justify-center rounded bg-indigo-50 px-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100"
                              title={`Avancer vers ${nextStatus.label}`}
                            >
                              Avancer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {colCandidates.length === 0 && (
                <div className="flex items-center justify-center py-6 border-2 border-dashed border-white/50 rounded-lg">
                  <span className="text-xs font-medium text-zinc-400">Aucun dossier</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
