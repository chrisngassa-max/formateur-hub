import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GuidedIntakePanel } from "../components/ai/GuidedIntakePanel";
import { ProjectionLiveCard } from "../components/ai/ProjectionLiveCard";
import { analyzeCandidateWithAi, type AiAnalysis } from "../lib/aiService";
import { createEmptyCandidate } from "../lib/candidateFactory";
import { projectCandidate } from "../lib/projectionEngine";
import { applyGuidedAnswer, getNextGuidedQuestion } from "../lib/questionEngine";
import { fetchCandidate, upsertCandidateRemote } from "../lib/candidatesRepo";
import { useAuth } from "../lib/auth";
import type { Candidate, GuidedAnswer } from "../types/candidate";
import { Bot, ChevronRight, FileEdit, ExternalLink, Activity, AlertCircle } from "lucide-react";

export function GuidedIntake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<Candidate>(() => createEmptyCandidate());
  const [loading, setLoading] = useState(Boolean(id));
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<GuidedAnswer[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCandidate(id).then((c) => {
      if (!c) setNotFound(true);
      else setCandidate(c);
      setLoading(false);
    });
  }, [id]);

  const projection = useMemo(() => projectCandidate(candidate), [candidate]);
  const currentQuestion = getNextGuidedQuestion(candidate, projection, answers);

  if (loading) return <div className="p-8 text-zinc-500 animate-pulse">Chargement…</div>;
  if (notFound) return <div className="p-8"><h2 className="text-xl font-bold text-zinc-900">Dossier introuvable</h2><Link to="/" className="text-indigo-600 hover:underline">Retour dashboard</Link></div>;

  async function handleAnswer(answer: GuidedAnswer) {
    if (!user) return;
    const nextCandidate =
      answer.status === "answered" && currentQuestion
        ? applyGuidedAnswer(candidate, currentQuestion, answer.value)
        : ({ ...candidate, updatedAt: new Date().toISOString() } as Candidate);

    setCandidate(nextCandidate);
    setAnswers((current) => [answer, ...current]);
    await upsertCandidateRemote(nextCandidate, user.id);
    if (!id) navigate(`/saisie-guidee/${nextCandidate.id}`, { replace: true });
  }

  async function saveAndOpenDetail() {
    if (!user) return;
    await upsertCandidateRemote(candidate, user.id);
    navigate(`/candidats/${candidate.id}`);
  }

  async function handleFinish(nextAction: string, followUpDate: string) {
    if (!user) return;
    const finalCandidate = { ...candidate, updatedAt: new Date().toISOString() };
    if (nextAction.trim()) finalCandidate.nextAction = nextAction.trim();
    if (followUpDate) finalCandidate.followUpDate = followUpDate;
    
    setCandidate(finalCandidate);
    await upsertCandidateRemote(finalCandidate, user.id);
    navigate(`/candidats/${finalCandidate.id}`);
  }

  async function runAiAnalysis() {
    setIsAnalyzing(true);
    setAiError(null);
    const response = await analyzeCandidateWithAi({ candidate, projection, localQuestion: currentQuestion });
    setIsAnalyzing(false);
    if (response.ok) { setAiAnalysis(response.result); return; }
    setAiAnalysis(null);
    setAiError(response.error);
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Saisie guidée
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Assistant de préqualification
          </h2>
          <p className="mt-2 text-sm text-zinc-500 max-w-2xl">
            Répondez question par question. La projection se met à jour automatiquement sur la droite en fonction de vos réponses.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50" 
            onClick={runAiAnalysis} 
            disabled={isAnalyzing}
          >
            <Bot size={16} />
            {isAnalyzing ? "Analyse en cours..." : "Analyser avec l'IA"}
          </button>
          <Link 
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" 
            to={`/candidats/${candidate.id}/edit`}
          >
            <FileEdit size={16} />
            Mode formulaire
          </Link>
          <button 
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" 
            onClick={saveAndOpenDetail}
          >
            <ExternalLink size={16} />
            Ouvrir la fiche
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        
        {/* Left Column - Questions & AI */}
        <div className="flex flex-col gap-6 flex-1 min-w-0 w-full">
          
          <GuidedIntakePanel 
            candidate={candidate} 
            question={currentQuestion} 
            onAnswer={handleAnswer} 
            onFinish={handleFinish}
          />

          {/* AI Analysis Panel */}
          <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Assistant IA</p>
                  <h3 className="text-lg font-bold text-zinc-900">Analyse du dossier</h3>
                </div>
              </div>
              <span 
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                  aiAnalysis ? "bg-emerald-100 text-emerald-800" : aiError ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {aiAnalysis ? `Confiance ${aiAnalysis.confidence}` : aiError ? "Mode local" : "En attente"}
              </span>
            </div>

            {aiError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-sm text-amber-800">IA indisponible : {aiError}. Le moteur local continue de guider la saisie.</p>
              </div>
            ) : null}

            {aiAnalysis ? (
              <div className="flex flex-col gap-6">
                <p className="text-sm leading-relaxed text-zinc-700">{aiAnalysis.summary}</p>
                
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase text-zinc-500">Aides probables</dt>
                    <dd className="text-sm font-medium text-zinc-900">{aiAnalysis.probable_aids.join(", ") || "À confirmer"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase text-zinc-500">Commentaire projection</dt>
                    <dd className="text-sm font-medium text-zinc-900">{aiAnalysis.projection_comment}</dd>
                  </div>
                </dl>

                {aiAnalysis.next_questions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Activity size={16} className="text-indigo-600" />
                      Questions suggérées par l'IA
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {aiAnalysis.next_questions.map((q) => (
                        <li key={`${q.field}-${q.question}`} className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-white p-3 text-sm shadow-sm">
                          <strong className="text-zinc-900">{q.question}</strong>
                          <span className="text-zinc-500 text-[13px]">{q.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.risk_flags.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600" />
                      Risques signalés
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {aiAnalysis.risk_flags.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100">
                          <span className="mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : !aiError ? (
              <p className="text-sm text-zinc-500 italic py-4">Cliquez sur "Analyser avec l'IA" en haut de la page pour lancer l'analyse prédictive. La clé est sécurisée côté serveur.</p>
            ) : null}
          </section>

          {/* History Panel */}
          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900">Historique de saisie</h3>
            {answers.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">Aucune réponse enregistrée pour cette session.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {answers.map((a) => (
                  <div className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0" key={`${a.questionId}-${a.answeredAt}`}>
                    <strong className="text-sm text-zinc-700">{a.questionId}</strong>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                      {a.status === "answered" ? "Renseigné" : a.status === "unknown" ? "Je ne sais pas" : "Non applicable"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column - Sticky Live Projection */}
        <div className="w-full xl:w-auto shrink-0 relative">
          <ProjectionLiveCard candidate={candidate} projection={projection} />
        </div>

      </div>
    </div>
  );
}
