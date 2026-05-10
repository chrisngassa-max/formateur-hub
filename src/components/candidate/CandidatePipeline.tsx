import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Check, MessageSquarePlus, Activity, ArrowRight, User } from "lucide-react";
import type { Candidate, CandidateEvent, PipelineStatus } from "../../types/candidate";
import { useAuth } from "../../lib/auth";

type CandidatePipelineProps = {
  candidate: Candidate;
  onUpdate: (updated: Candidate) => Promise<void>;
};

const pipelineStatuses: { value: PipelineStatus; label: string }[] = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "en_attente_candidat", label: "Attente candidat" },
  { value: "pret_a_deposer", label: "Prêt à déposer" },
  { value: "depose", label: "Déposé" },
  { value: "gagne", label: "Gagné" },
  { value: "perdu", label: "Perdu" },
  { value: "abandonne", label: "Abandonné" },
  { value: "archive", label: "Archivé" },
];

export function CandidatePipeline({ candidate, onUpdate }: CandidatePipelineProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  
  // Local state for optimistic UI updates before saving
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>(candidate.pipelineStatus || "nouveau");
  const [nextAction, setNextAction] = useState(candidate.nextAction || "");
  const [followUpDate, setFollowUpDate] = useState(candidate.followUpDate || "");

  const handleStatusChange = async (newStatus: PipelineStatus) => {
    if (newStatus === candidate.pipelineStatus) return;
    setLoading(true);
    try {
      const event: CandidateEvent = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        authorId: user?.id || "system",
        authorName: user?.email?.split('@')[0] || "User",
        type: "status_change",
        content: `Statut changé de "${pipelineStatuses.find(s => s.value === candidate.pipelineStatus)?.label || 'Nouveau'}" à "${pipelineStatuses.find(s => s.value === newStatus)?.label}"`,
        visibility: "public"
      };

      const updated = { 
        ...candidate, 
        pipelineStatus: newStatus,
        events: [event, ...(candidate.events || [])]
      };
      
      await onUpdate(updated);
      setPipelineStatus(newStatus);
    } finally {
      setLoading(false);
    }
  };

  const saveActionDetails = async () => {
    if (nextAction === candidate.nextAction && followUpDate === candidate.followUpDate) return;
    setLoading(true);
    try {
      const updated = { 
        ...candidate, 
        nextAction,
        followUpDate
      };
      await onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setLoading(true);
    try {
      const event: CandidateEvent = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        authorId: user?.id || "system",
        authorName: user?.email?.split('@')[0] || "User",
        type: "note",
        content: noteContent.trim(),
        visibility: "public"
      };

      const updated = { 
        ...candidate, 
        events: [event, ...(candidate.events || [])]
      };
      
      await onUpdate(updated);
      setNoteContent("");
    } finally {
      setLoading(false);
    }
  };

  const formatDateLabel = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "d MMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Status Pipeline Header ── */}
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Activity size={18} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Suivi du dossier</h3>
          </div>
        </div>

        {/* Pipeline Visualizer */}
        <div className="mt-2 hidden sm:flex items-center w-full overflow-hidden rounded-lg bg-zinc-100 p-1">
          {pipelineStatuses.slice(0, 6).map((status, index) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              disabled={loading}
              className={`flex-1 relative flex items-center justify-center py-2 text-xs font-bold transition-colors z-10 ${
                pipelineStatus === status.value 
                  ? "bg-white text-indigo-700 shadow-sm rounded-md" 
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown for Mobile / All Statuses */}
        <div className="flex sm:hidden flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500">Statut actuel</label>
          <select 
            value={pipelineStatus}
            onChange={(e) => handleStatusChange(e.target.value as PipelineStatus)}
            disabled={loading}
            className="h-10 rounded-lg border-zinc-200 text-sm font-semibold text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
          >
            {pipelineStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Prochaine Action ── */}
        <section className="md:col-span-1 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm h-fit">
          <h3 className="text-sm font-bold text-zinc-900">Prochaine action</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-500">Quoi faire ?</label>
              <textarea
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                onBlur={saveActionDetails}
                placeholder="Ex: Relancer pour le CV..."
                className="min-h-[80px] rounded-lg border-zinc-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none disabled:opacity-50"
                disabled={loading}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-500">Pour quand ?</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  onBlur={saveActionDetails}
                  className="h-10 w-full pl-9 rounded-lg border-zinc-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Historique & Notes ── */}
        <section className="md:col-span-2 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900">Notes et historique</h3>
          
          <form onSubmit={addNote} className="flex flex-col gap-3">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Ajouter une note..."
              className="min-h-[100px] w-full rounded-xl border-zinc-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-y disabled:opacity-50 bg-zinc-50/50"
              disabled={loading}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !noteContent.trim()}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <MessageSquarePlus size={14} /> Ajouter la note
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-zinc-200">
            {(!candidate.events || candidate.events.length === 0) ? (
              <p className="text-sm text-zinc-500 pl-8 italic">Aucun événement dans l'historique.</p>
            ) : (
              candidate.events.map((event) => (
                <div key={event.id} className="relative pl-8 flex flex-col gap-1">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                    event.type === 'status_change' ? 'bg-indigo-100 text-indigo-600' :
                    event.type === 'note' ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {event.type === 'status_change' ? <Activity size={10} /> :
                     event.type === 'note' ? <MessageSquarePlus size={10} /> : <User size={10} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">{event.authorName}</span>
                    <span className="text-[10px] text-zinc-500">{formatDateLabel(event.createdAt)}</span>
                  </div>
                  <div className="text-sm text-zinc-700 bg-zinc-50 rounded-lg p-3 border border-zinc-100 mt-1 whitespace-pre-wrap">
                    {event.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
