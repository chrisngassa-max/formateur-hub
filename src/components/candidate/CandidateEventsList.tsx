import { useEffect, useState } from "react";
import { fetchCandidateEvents } from "../../lib/candidatesRepo";
import { fetchProfiles, UserProfile } from "../../lib/profilesRepo";
import { Clock, History, FileEdit, User, Trash2, CheckCircle2 } from "lucide-react";

type EventRow = {
  id: string;
  candidate_id: string;
  user_id: string;
  event_type: string;
  payload: any;
  comment: string | null;
  created_at: string;
};

type Props = {
  candidateId: string;
};

export function CandidateEventsList({ candidateId }: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCandidateEvents(candidateId),
      fetchProfiles()
    ]).then(([evts, profs]) => {
      setEvents(evts as EventRow[]);
      setProfiles(profs);
      setLoading(false);
    });
  }, [candidateId]);

  if (loading) {
    return <div className="animate-pulse flex gap-2 text-zinc-500 text-sm py-4"><History size={16} /> Chargement de l'historique...</div>;
  }

  if (events.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 italic">Aucun historique disponible pour ce dossier.</p>;
  }

  function getEventIcon(type: string) {
    switch (type) {
      case "created": return <CheckCircle2 size={16} className="text-emerald-500" />;
      case "updated": return <FileEdit size={16} className="text-indigo-500" />;
      case "deleted": return <Trash2 size={16} className="text-red-500" />;
      case "system": return <User size={16} className="text-zinc-500" />;
      default: return <Clock size={16} className="text-zinc-400" />;
    }
  }

  function getEventLabel(type: string) {
    switch (type) {
      case "created": return "Création du dossier";
      case "updated": return "Mise à jour";
      case "deleted": return "Suppression";
      case "system": return "Action système";
      default: return type;
    }
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      <ul className="relative border-l border-zinc-200 ml-3 flex flex-col gap-6 pb-2">
        {events.map((evt) => {
          const profile = profiles.find(p => p.id === evt.user_id);
          const authorName = profile ? (profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.email) : "Utilisateur inconnu";
          const date = new Date(evt.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

          return (
            <li key={evt.id} className="relative pl-6">
              <span className="absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-8 ring-white">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-50 border border-zinc-200">
                  {getEventIcon(evt.event_type)}
                </div>
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900">{getEventLabel(evt.event_type)}</span>
                  <span className="text-xs text-zinc-500">• {date}</span>
                </div>
                <div className="text-sm text-zinc-600">
                  Par <span className="font-semibold text-zinc-700">{authorName}</span>
                </div>
                {evt.comment && (
                  <p className="mt-1 text-sm text-zinc-700 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    {evt.comment}
                  </p>
                )}
                {evt.event_type === "updated" && evt.payload?.changes && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.keys(evt.payload.changes).slice(0, 3).map(key => (
                      <span key={key} className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                        {key} modifié
                      </span>
                    ))}
                    {Object.keys(evt.payload.changes).length > 3 && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                        +{Object.keys(evt.payload.changes).length - 3} autres
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
