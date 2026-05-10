import { formatCurrency } from "../../lib/format";
import type { Candidate, ProjectionResult } from "../../types/candidate";
import { ScoreGauge } from "./ScoreGauge";

type ProjectionSummaryProps = {
  candidate: Candidate;
  projection: ProjectionResult;
};

const priorityLabel = {
  prioritaire: "Dossier prioritaire",
  financement_partiel: "Financement partiel",
  aide_limitee: "Aide limitée",
  a_completer: "À compléter",
};

export function ProjectionSummary({ candidate, projection }: ProjectionSummaryProps) {
  const tone = projection.priority === "prioritaire" ? "green" : projection.priority === "aide_limitee" ? "red" : "amber";

  return (
    <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 rounded-2xl bg-indigo-950 p-8 text-white shadow-lg overflow-hidden relative">
      {/* Decorative background circle */}
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-900 blur-3xl opacity-50" aria-hidden="true" />
      
      <div className="flex flex-col relative z-10 xl:max-w-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Projection globale</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">{priorityLabel[projection.priority]}</h2>
        <p className="mt-3 text-indigo-200">
          <strong className="text-white">{candidate.firstName} {candidate.lastName}</strong> vise <strong className="text-white">{candidate.trainingName}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 relative z-10 flex-1">
        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
          <ScoreGauge label="Finançabilité" value={projection.financingScore} tone={tone} />
        </div>
        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
          <ScoreGauge label="Complétude" value={projection.completionScore} tone="blue" />
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
          <span className="text-xs font-semibold uppercase text-indigo-200">Reste prudent</span>
          <strong className="mt-1 text-2xl font-bold tracking-tight text-white">{formatCurrency(projection.estimatedRemainingCost)}</strong>
          <small className="mt-1 text-[11px] text-indigo-300">Confiance {projection.financialBreakdown.confidence}</small>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
          <span className="text-xs font-semibold uppercase text-indigo-200">Reste potentiel OPCO</span>
          <strong className="mt-1 text-2xl font-bold tracking-tight text-emerald-400">{formatCurrency(projection.businessForecast.expectedRemainingCost)}</strong>
          <small className="mt-1 text-[11px] text-indigo-300">Sous réserve de validation</small>
        </div>
      </div>
    </section>
  );
}
