import { useEffect, useState } from "react";
import { fetchAdminUsers, type AdminUser } from "../../lib/adminRepo";
import { useCandidates } from "../useCandidates";
import { Shield, User, Users, Briefcase, Activity, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { candidates } = useCandidates();

  useEffect(() => {
    fetchAdminUsers()
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        <div className="h-64 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 text-red-800 border border-red-200">
        <h3 className="font-bold mb-2">Erreur d'accès à l'équipe</h3>
        <p className="text-sm">{error}</p>
        <p className="text-sm mt-4 text-red-600">
          La fonction Edge `admin-users` n'est peut-être pas déployée.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Équipe et accès
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Gestion des conseillers et suivi de leur charge de travail.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Utilisateur</th>
                <th className="px-6 py-4 font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Rôle</th>
                <th className="px-6 py-4 font-bold text-zinc-900 uppercase text-[10px] tracking-wider text-center">Dossiers Actifs</th>
                <th className="px-6 py-4 font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map(u => {
                const activeDossiers = candidates.filter(c => c.assignedTo === u.id || c.ownerId === u.id).length;
                
                return (
                  <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <strong className="text-zinc-900">{u.email}</strong>
                          <span className="text-[11px] text-zinc-500 font-mono">ID: {u.id.split('-')[0]}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        u.role === 'admin' 
                          ? "bg-violet-100 text-violet-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                        <Briefcase size={14} />
                        {activeDossiers}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-600 text-xs">
                        <CalendarIcon size={14} className="text-zinc-400" />
                        {u.last_sign_in_at 
                          ? format(new Date(u.last_sign_in_at), "d MMM yyyy 'à' HH:mm", { locale: fr })
                          : "Jamais"
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
