import { BarChart3, BookOpen, FileText, LogOut, MessageSquareText, Plus, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user, roles, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      {/* Sidebar - Fixe sur la gauche avec le thème sombre (Zinc-950) pour contraster */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col bg-zinc-950 text-zinc-300 shadow-xl">
        <div className="flex flex-col gap-8 px-6 py-8 h-full">
          {/* Logo / Brand */}
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <span className="text-lg font-black tracking-tight">FP</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Simulateur interne
              </p>
              <h1 className="text-xl font-bold text-white tracking-tight">
                FormaPredict
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5 mt-2 flex-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`
              }
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/saisie-guidee"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`
              }
            >
              <MessageSquareText size={18} />
              <span>Saisie guidée</span>
            </NavLink>
            <NavLink
              to="/candidats/nouveau"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`
              }
            >
              <Plus size={18} />
              <span>Nouveau candidat</span>
            </NavLink>
            <NavLink
              to="/formations"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`
              }
            >
              <BookOpen size={18} />
              <span>Formations</span>
            </NavLink>
            <NavLink
              to="/documents"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`
              }
            >
              <FileText size={18} />
              <span>Documents</span>
            </NavLink>
            <NavLink
              to="/parametres"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`
              }
            >
              <Settings size={18} />
              <span>Paramètres</span>
            </NavLink>
          </nav>

          {/* User Section & Footer */}
          <div className="mt-auto flex flex-col gap-4 pt-6">
            {user && (
              <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white truncate">
                    {user.email}
                  </span>
                  <span className="text-xs text-zinc-500 capitalize">
                    {roles.join(", ") || "Utilisateur"}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white w-full"
                >
                  <LogOut size={14} /> Se déconnecter
                </button>
              </div>
            )}
            
            <p className="text-[11px] leading-relaxed text-zinc-500 text-center px-2">
              Projection indicative. Les aides doivent être vérifiées auprès des organismes concernés.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Décalé pour laisser la place à la sidebar fixe */}
      <main className="flex-1 ml-72">
        <div className="mx-auto max-w-6xl p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
