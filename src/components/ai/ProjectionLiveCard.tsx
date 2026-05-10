import { formatCurrency } from "../../lib/format";
import type { Candidate, ProjectionResult } from "../../types/candidate";
import { ScoreGauge } from "../projection/ScoreGauge";

type ProjectionLiveCardProps = {
  candidate: Candidate;
  projection: ProjectionResult;
};

const priorityLabel = {
  prioritaire: "Prioritaire",
  financement_partiel: "Financement partiel",
  aide_limitee: "Aide limitée",
  a_completer: "À compléter",
};

export function ProjectionLiveCard({ candidate, projection }: ProjectionLiveCardProps) {
  const activeAids = projection.aids
    .filter((aid) => aid.status === "probable" || aid.status === "a_verifier")
    .slice(0, 4);
  const missingDocumentsCount = projection.missingDocuments.filter((item) => item.status !== "present").length;

  return (
    <aside className="sticky top-8 flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm xl:w-96">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Projection en temps réel</p>
          <h3 className="mt-1 text-lg font-bold text-zinc-900">{priorityLabel[projection.priority]}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {candidate.firstName || "Nouveau"} {candidate.lastName || "candidat"} · {candidate.trainingName || "formation à préciser"}
          </p>
        </div>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ScoreGauge label="Finançabilité" value={projection.financingScore} tone={projection.financingScore >= 70 ? "green" : projection.financingScore >= 40 ? "amber" : "red"} />
        <ScoreGauge label="Complétude" value={projection.completionScore} tone="blue" />
        <ScoreGauge label="Documents" value={projection.documentScore} tone="blue" />
        <ScoreGauge label="Risque admin." value={projection.adminRiskScore} tone={projection.adminRiskScore > 60 ? "red" : projection.adminRiskScore > 30 ? "amber" : "green"} />
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-4">
        <div className="flex flex-col">
          <dt className="text-[10px] font-semibold uppercase text-zinc-500">Reste estimé</dt>
          <dd className="mt-1 font-mono text-sm font-bold text-zinc-900">{formatCurrency(projection.estimatedRemainingCost)}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[10px] font-semibold uppercase text-zinc-500">Manquants</dt>
          <dd className="mt-1 font-mono text-sm font-bold text-zinc-900">{missingDocumentsCount} pièce(s)</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[10px] font-semibold uppercase text-zinc-500">Confiance</dt>
          <dd className="mt-1 font-mono text-sm font-bold text-zinc-900 capitalize">{projection.financialBreakdown.confidence}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Aides probables</h4>
        <div className="flex flex-wrap gap-2">
          {activeAids.length > 0 ? (
            activeAids.map((aid) => (
              <span key={aid.id} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                {aid.name}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center rounded-md bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-500/10">
              À préciser
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 border-t border-zinc-100 pt-4 text-[10px] leading-relaxed text-zinc-400">
        Projection indicative. Ne constitue pas une décision officielle de financement.
      </p>
    </aside>
  );
}
