import type { FollowUpQuestion } from "../../types/candidate";
import { MessageCircleQuestion } from "lucide-react";

type FollowUpQuestionsProps = {
  questions: FollowUpQuestion[];
};

const targetLabel = {
  secretaire: "Secrétaire",
  candidat: "Candidat",
  employeur: "Employeur",
  conseiller: "Conseiller",
  financeur: "Financeur",
};

export function FollowUpQuestions({ questions }: FollowUpQuestionsProps) {
  if (questions.length === 0) {
    return <p className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-xl border border-zinc-100">Aucune question prioritaire générée.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.map((question) => (
        <article className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm" key={question.id}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              {targetLabel[question.target]}
            </span>
            <span className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
              question.priority === "haute" ? "text-red-600" 
              : question.priority === "moyenne" ? "text-amber-600" 
              : "text-blue-600"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                question.priority === "haute" ? "bg-red-500" 
                : question.priority === "moyenne" ? "bg-amber-500" 
                : "bg-blue-500"
              }`} />
              Prio {question.priority}
            </span>
          </div>
          <h4 className="mt-1 text-sm font-bold text-zinc-900 flex items-start gap-2">
            <MessageCircleQuestion size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            {question.question}
          </h4>
          <p className="text-[13px] text-zinc-600 ml-6">{question.reason}</p>
        </article>
      ))}
    </div>
  );
}
