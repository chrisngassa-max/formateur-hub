import { ArrowRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../lib/format";
import { projectCandidate } from "../../lib/projectionEngine";
import type { Candidate } from "../../types/candidate";

type CandidateCardsProps = {
  candidates: Candidate[];
};

const priorityConfig = {
  prioritaire: { label: "Prioritaire", className: "bg-emerald-100 text-emerald-800" },
  financement_partiel: { label: "Partiel", className: "bg-amber-100 text-amber-800" },
  aide_limitee: { label: "Aide limitée", className: "bg-red-100 text-red-800" },
  a_completer: { label: "À compléter", className: "bg-zinc-100 text-zinc-600" },
};

const toneConfig = {
  danger: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  neutral: "bg-zinc-100 text-zinc-600",
  success: "bg-emerald-100 text-emerald-800",
};

export function CandidateCards({ candidates }: CandidateCardsProps) {
  const rows = candidates
    .map((candidate) => ({ candidate, projection: projectCandidate(candidate) }))
    .sort((a, b) => b.projection.financingScore - a.projection.financingScore);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-4">
          <Inbox size={32} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">Aucun candidat</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Ajoutez un premier candidat pour voir les projections.
        </p>
        <Link
          to="/candidats/nouveau"
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Nouveau candidat
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-100">
      {rows.map(({ candidate, projection }) => {
        const priority = priorityConfig[projection.priority];
        const toneCls = toneConfig[projection.diagnostic.displayTone] ?? toneConfig.neutral;

        return (
          <div key={candidate.id} className="flex flex-col gap-3 p-4 hover:bg-zinc-50/80 transition-colors">
            {/* Top row: name + action */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <strong className="text-sm font-bold text-zinc-900 truncate">
                  {candidate.firstName} {candidate.lastName}
                </strong>
                <span className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">
                  {candidate.trainingName}
                </span>
              </div>
              <Link
                to={`/candidats/${candidate.id}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-indigo-600 shadow-sm hover:bg-indigo-50 hover:border-indigo-200"
                aria-label={`Ouvrir la fiche de ${candidate.firstName} ${candidate.lastName}`}
              >
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Badges + score */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${toneCls}`}>
                {projection.diagnostic.displayLabel}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${priority.className}`}>
                {priority.label}
              </span>
              {projection.businessForecast.followUpDue && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800">
                  À relancer
                </span>
              )}
            </div>

            {/* Score bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Financement</span>
                <span className="font-bold text-zinc-900">{projection.financingScore}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    projection.financingScore >= 70
                      ? "bg-emerald-500"
                      : projection.financingScore >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, projection.financingScore))}%` }}
                />
              </div>
            </div>

            {/* Bottom row: financeur + reste */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
              <span className="text-xs font-medium text-zinc-600">
                {projection.diagnostic.primaryPath}
              </span>
              <span className="text-xs font-bold text-zinc-900">
                Reste : {formatCurrency(projection.estimatedRemainingCost)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
