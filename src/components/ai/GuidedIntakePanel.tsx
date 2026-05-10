import { useEffect, useState } from "react";
import type { Candidate, FollowUpQuestion, GuidedAnswer } from "../../types/candidate";

type GuidedIntakePanelProps = {
  candidate: Candidate;
  question: FollowUpQuestion | null;
  onAnswer: (answer: GuidedAnswer) => void;
  onFinish?: (nextAction: string, followUpDate: string) => void;
};

export function GuidedIntakePanel({ candidate, question, onAnswer, onFinish }: GuidedIntakePanelProps) {
  const [value, setValue] = useState<string>("");
  const [nextAction, setNextAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  useEffect(() => {
    if (!question?.field) {
      setValue("");
      return;
    }
    const currentValue = candidate[question.field];
    setValue(typeof currentValue === "boolean" ? String(currentValue) : currentValue ? String(currentValue) : "");
  }, [candidate, question]);

  if (!question) {
    return (
      <section className="flex flex-col gap-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 shadow-sm">
        <div className="flex gap-2" aria-label="Progression saisie">
          {["1. Profil", "2. Financement", "3. Formation", "4. Documents", "5. Synthèse"].map((step, i) => (
            <span key={step} className={`text-[10px] font-bold uppercase tracking-wider ${i < 4 ? "text-emerald-600" : "text-emerald-800"}`}>
              {step} {i < 4 && <span className="text-emerald-300 mx-1">›</span>}
            </span>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Étape 5/5 — Synthèse</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">Diagnostic généré</h2>
          <p className="mt-2 text-emerald-800">Le dossier est suffisamment renseigné pour évaluer la faisabilité.</p>
        </div>

        <div className="mt-4 rounded-xl bg-white p-6 border border-emerald-100 shadow-sm flex flex-col gap-4">
          <p className="text-sm font-semibold text-zinc-900">Avant de terminer (facultatif) :</p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-700">Prochaine action</span>
              <input
                type="text"
                placeholder="ex: Envoyer devis, Rappeler candidat..."
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-700">Date de rappel</span>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
          
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-100">
            <button
              onClick={() => onFinish?.("", "")}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Passer cette étape
            </button>
            <button
              onClick={() => onFinish?.(nextAction, followUpDate)}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Enregistrer et terminer
            </button>
          </div>
        </div>
      </section>
    );
  }
  const activeQuestion = question;

  function parseValue(): unknown {
    if (activeQuestion.answerType === "number") return Number(value);
    if (activeQuestion.answerType === "boolean") return value === "true";
    return value;
  }

  function submit(status: GuidedAnswer["status"]) {
    onAnswer({
      questionId: activeQuestion.id,
      field: activeQuestion.field,
      status,
      value: status === "answered" ? parseValue() : undefined,
      answeredAt: new Date().toISOString(),
    });
    setValue("");
  }

  return (
    <section className="flex flex-col gap-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap gap-2" aria-label="Progression saisie">
        {["1. Profil", "2. Financement", "3. Formation", "4. Documents", "5. Synthèse"].map((step, i) => (
          <span key={step} className={`text-[10px] font-bold uppercase tracking-wider ${i === 1 ? "text-indigo-600" : i < 1 ? "text-zinc-500" : "text-zinc-300"}`}>
            {step} {i < 4 && <span className="text-zinc-200 mx-1">›</span>}
          </span>
        ))}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Question suivante · Priorité {activeQuestion.priority}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{activeQuestion.question}</h2>
        <p className="mt-2 text-sm text-zinc-500">{activeQuestion.reason}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-6 border border-zinc-100">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-zinc-700">Champ concerné : {activeQuestion.field ?? "information dossier"}</span>
          {activeQuestion.answerType === "boolean" ? (
            <select 
              value={value} 
              onChange={(event) => setValue(event.target.value)}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sélectionner</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          ) : activeQuestion.answerType === "select" ? (
            <select 
              value={value} 
              onChange={(event) => setValue(event.target.value)}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sélectionner</option>
              {activeQuestion.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={activeQuestion.answerType === "number" ? "number" : "text"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Votre réponse..."
            />
          )}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button 
          type="button" 
          disabled={activeQuestion.answerType !== "boolean" && value.trim().length === 0} 
          onClick={() => submit("answered")}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-6 font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Je renseigne
        </button>
        <button 
          type="button" 
          onClick={() => submit("unknown")}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Je ne sais pas
        </button>
        <button 
          type="button" 
          onClick={() => submit("not_applicable")}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Non applicable
        </button>
      </div>
    </section>
  );
}
