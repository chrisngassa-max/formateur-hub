import { BarChart3, BookOpen, FileText, LogOut, MessageSquareText, Plus, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user, roles, signOut } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Simulateur interne</p>
          <h1>FormaPredict</h1>
        </div>
        <nav>
          <NavLink to="/" end>
            <BarChart3 size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/saisie-guidee">
            <MessageSquareText size={18} />
            Saisie guidée
          </NavLink>
          <NavLink to="/candidats/nouveau">
            <Plus size={18} />
            Nouveau candidat
          </NavLink>
          <NavLink to="/formations">
            <BookOpen size={18} />
            Formations
          </NavLink>
          <NavLink to="/documents">
            <FileText size={18} />
            Documents
          </NavLink>
          <NavLink to="/parametres">
            <Settings size={18} />
            Paramètres
          </NavLink>
        </nav>
        {user && (
          <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span style={{ opacity: 0.7 }}>{user.email}</span>
            <span style={{ opacity: 0.6 }}>{roles.join(", ") || "—"}</span>
            <button className="secondary" onClick={signOut}>
              <LogOut size={14} /> Se déconnecter
            </button>
          </div>
        )}
        <p className="legal-small">
          Projection indicative. Les aides doivent être vérifiées auprès des organismes concernés.
        </p>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
