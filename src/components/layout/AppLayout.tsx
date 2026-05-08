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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">FP</span>
          <div>
            <p className="sidebar-kicker">Simulateur interne</p>
            <h1>FormaPredict</h1>
          </div>
        </div>

        <nav>
          <NavLink to="/" end>
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/saisie-guidee">
            <MessageSquareText size={18} />
            <span>Saisie guidee</span>
          </NavLink>
          <NavLink to="/candidats/nouveau">
            <Plus size={18} />
            <span>Nouveau candidat</span>
          </NavLink>
          <NavLink to="/formations">
            <BookOpen size={18} />
            <span>Formations</span>
          </NavLink>
          <NavLink to="/documents">
            <FileText size={18} />
            <span>Documents</span>
          </NavLink>
          <NavLink to="/parametres">
            <Settings size={18} />
            <span>Parametres</span>
          </NavLink>
        </nav>

        {user && (
          <div className="sidebar-user">
            <span className="user-email">{user.email}</span>
            <span>{roles.join(", ") || "-"}</span>
            <button className="secondary" onClick={signOut}>
              <LogOut size={14} /> Se deconnecter
            </button>
          </div>
        )}

        <p className="legal-small">
          Projection indicative. Les aides doivent etre verifiees aupres des organismes concernes.
        </p>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
