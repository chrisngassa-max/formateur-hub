import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth";
import { ShieldCheck, User, UserCheck, UserX, RefreshCw, Crown } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
};

export function AdminUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!isAdmin) return <Navigate to="/" replace />;

  async function loadUsers() {
    setLoading(true);
    // Fetch all user_roles with user info via auth.users (via admin RPC ou join)
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const { data: authUsers } = await supabase.auth.admin?.listUsers?.() ?? { data: null };

    // Regroupement des rôles par user_id
    const rolesByUser: Record<string, string[]> = {};
    for (const r of roles ?? []) {
      if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
      rolesByUser[r.user_id].push(r.role);
    }

    // Fallback si admin API non disponible : on affiche juste les user_roles connus
    const knownUserIds = Object.keys(rolesByUser);
    const rows: UserRow[] = knownUserIds.map((uid) => ({
      id: uid,
      email: uid.slice(0, 8) + "...", // masqué si pas d'accès admin auth
      created_at: "",
      roles: rolesByUser[uid] ?? [],
    }));

    setUsers(rows);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function promoteUser(userId: string) {
    setActionLoading(userId);
    await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    await loadUsers();
    setActionLoading(null);
  }

  async function demoteUser(userId: string) {
    setActionLoading(userId);
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    await loadUsers();
    setActionLoading(null);
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Administration
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Gestion des utilisateurs
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Gérez les rôles des conseillers et administrateurs de la plateforme.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <RefreshCw size={16} /> Actualiser
        </button>
      </header>

      {/* Légende des rôles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Crown size={20} />
          </div>
          <div>
            <p className="font-bold text-amber-900">Administrateur</p>
            <p className="text-sm text-amber-700 mt-1">Accès complet : tous les dossiers, gestion des utilisateurs, paramètres globaux.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <User size={20} />
          </div>
          <div>
            <p className="font-bold text-indigo-900">Conseiller</p>
            <p className="text-sm text-indigo-700 mt-1">Accès limité à ses propres dossiers. Ne peut pas gérer les utilisateurs.</p>
          </div>
        </div>
      </div>

      {/* Table des utilisateurs */}
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">
          Utilisateurs enregistrés
        </h3>

        {loading ? (
          <p className="text-sm text-zinc-500 animate-pulse py-4">Chargement...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-zinc-500 italic py-4">Aucun utilisateur trouvé dans la table user_roles.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {users.map((u) => {
              const isUserAdmin = u.roles.includes("admin");
              return (
                <div key={u.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${isUserAdmin ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {isUserAdmin ? <Crown size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">{u.email}</p>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{u.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isUserAdmin ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"}`}>
                      {isUserAdmin ? <Crown size={12} /> : <User size={12} />}
                      {isUserAdmin ? "Admin" : "Conseiller"}
                    </span>
                    {isUserAdmin ? (
                      <button
                        onClick={() => demoteUser(u.id)}
                        disabled={actionLoading === u.id}
                        className="inline-flex h-8 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
                      >
                        <UserX size={14} />
                        {actionLoading === u.id ? "..." : "Rétrograder conseiller"}
                      </button>
                    ) : (
                      <button
                        onClick={() => promoteUser(u.id)}
                        disabled={actionLoading === u.id}
                        className="inline-flex h-8 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        <UserCheck size={14} />
                        {actionLoading === u.id ? "..." : "Promouvoir admin"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
