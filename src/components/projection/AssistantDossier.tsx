import type { ProjectionResult } from "../../types/candidate";
import { DocumentChecklist } from "./DocumentChecklist";
import { FolderTree } from "./FolderTree";
import { FollowUpQuestions } from "./FollowUpQuestions";
import { InternalNote } from "./InternalNote";
import { ScoreGauge } from "./ScoreGauge";
import { Bot, CheckSquare, MessageSquare, Folder, StickyNote } from "lucide-react";

type AssistantDossierProps = {
  projection: ProjectionResult;
};

export function AssistantDossier({ projection }: AssistantDossierProps) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-b border-zinc-100 pb-6">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
            <Bot size={14} /> Assistant dossier local
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Préparation du dossier</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-xl">
            Checklist, questions et arborescence générées par règles locales, sans IA externe.
          </p>
        </div>
        <div className="flex gap-4">
          <ScoreGauge label="Documents" value={projection.documentScore} tone="blue" />
          <ScoreGauge label="Risque admin." value={projection.adminRiskScore} tone={projection.adminRiskScore > 60 ? "red" : projection.adminRiskScore > 30 ? "amber" : "green"} />
        </div>
      </div>

      {/* Grid: Checklist & Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <CheckSquare size={18} className="text-indigo-500" />
            Pièces à réunir
          </h3>
          <DocumentChecklist items={projection.missingDocuments} />
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-500" />
            Questions à poser
          </h3>
          <FollowUpQuestions questions={projection.followUpQuestions} />
        </div>
      </div>

      {/* Grid: Folder Tree & Note */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Folder size={18} className="text-indigo-500" />
            Arborescence dossier
          </h3>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <FolderTree nodes={projection.folderTree} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <StickyNote size={18} className="text-indigo-500" />
            Note interne
          </h3>
          <InternalNote note={projection.internalNote} />
        </div>
      </div>
    </section>
  );
}
