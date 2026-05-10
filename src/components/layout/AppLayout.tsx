import { BarChart3, BookOpen, FileText, LogOut, Menu, MessageSquareText, Plus, Settings, ShieldCheck, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";

type AppLayoutProps = {
  children: ReactNode;
};

const navLinks = [
  { to: "/", icon: BarChart3, label: "Dashboard", end: true },
  { to: "/saisie-guidee", icon: MessageSquareText, label: "Saisie guidée" },
  { to: "/candidats/nouveau", icon: Plus, label: "Nouveau candidat" },
  { to: "/formations", icon: BookOpen, label: "Formations" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/parametres", icon: Settings, label: "Paramètres" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Fermer le drawer si on navigue
  const handleNavClick = () => setDrawerOpen(false);

  const SidebarContent = () => (
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
      <nav className="flex flex-col gap-1.5 mt-2 flex-1" aria-label="Navigation principale">
        {navLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`
            }
            aria-current={location.pathname === to ? "page" : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Section Admin - uniquement pour les admins */}
        {isAdmin && (
          <>
            <div className="mt-2 border-t border-zinc-800 pt-2">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                Administration
              </p>
            </div>
            <NavLink
              to="/admin/utilisateurs"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                  isActive
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                    : "text-amber-400 hover:bg-zinc-900 hover:text-amber-300"
                }`
              }
            >
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Gestion utilisateurs</span>
            </NavLink>
            <NavLink
              to="/admin/reporting"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                  isActive
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                    : "text-amber-400 hover:bg-zinc-900 hover:text-amber-300"
                }`
              }
            >
              <BarChart3 size={18} aria-hidden="true" />
              <span>Reporting Global</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Section & Footer */}
      <div className="mt-auto flex flex-col gap-4 pt-6">
        {user && (
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                  {user.email}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  isAdmin
                    ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                    : "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30"
                }`}>
                  {isAdmin ? <ShieldCheck size={10} aria-hidden="true" /> : null}
                  {isAdmin ? "Admin" : "Conseiller"}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white w-full min-h-[44px]"
              aria-label="Se déconnecter"
            >
              <LogOut size={14} aria-hidden="true" /> Se déconnecter
            </button>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-zinc-500 text-center px-2">
          Projection indicative. Les aides doivent être vérifiées auprès des organismes concernés.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50/50">

      {/* ── SIDEBAR DESKTOP (fixe, visible md+) ── */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden md:flex w-72 flex-col bg-zinc-950 text-zinc-300 shadow-xl">
        <SidebarContent />
      </aside>

      {/* ── DRAWER MOBILE (glissant, visible < md) ── */}
      {/* Overlay sombre */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panneau drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-zinc-950 text-zinc-300 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu de navigation"
        aria-expanded={drawerOpen}
      >
        {/* Bouton de fermeture dans le drawer */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          aria-label="Fermer le menu"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-72">

        {/* Header mobile (visible < md) */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden shadow-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50"
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <span className="text-xs font-black">FP</span>
            </div>
            <span className="text-sm font-bold text-zinc-900">FormaPredict</span>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isAdmin
              ? "bg-amber-100 text-amber-700"
              : "bg-indigo-100 text-indigo-700"
          }`}>
            {isAdmin ? <ShieldCheck size={10} aria-hidden="true" /> : null}
            {isAdmin ? "Admin" : "Conseiller"}
          </span>
        </header>

        {/* Contenu de la page */}
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
