import { useEffect, useState } from "react";
import { X, User } from "lucide-react";
import { UserProfile, fetchProfiles } from "../../lib/profilesRepo";
import type { Candidate } from "../../types/candidate";

type AdminReassignModalProps = {
  candidate: Candidate;
  onClose: () => void;
  onAssign: (userId: string | undefined) => void;
};

export function AdminReassignModal({ candidate, onClose, onAssign }: AdminReassignModalProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>(candidate.assignedTo);

  useEffect(() => {
    fetchProfiles().then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <User size={18} className="text-indigo-600" />
            Réassigner le dossier
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            Sélectionnez le conseiller en charge du candidat <strong>{candidate.firstName} {candidate.lastName}</strong>.
          </p>

          {loading ? (
            <div className="h-10 bg-zinc-100 animate-pulse rounded-lg mt-2"></div>
          ) : (
            <select
              value={selectedId || ""}
              onChange={(e) => setSelectedId(e.target.value || undefined)}
              className="mt-2 block w-full rounded-lg border-zinc-300 bg-zinc-50 py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Non assigné</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.email}
                </option>
              ))}
            </select>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 p-4 border-t border-zinc-100 bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onAssign(selectedId)}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            Confirmer
          </button>
        </footer>
      </div>
    </div>
  );
}
