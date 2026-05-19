import { Award, BookOpen, Clock, FileText, LayoutDashboard, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";

export function InscritDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Espace Candidat</span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">Mon Espace Formation</h1>
          <p className="text-zinc-400 mt-1">Suivez l'avancement de vos démarches et de votre apprentissage.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-sm font-semibold">
          <Clock size={16} />
          <span>Session inactive</span>
        </div>
      </div>

      {/* Glassmorphic Placeholder Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 to-indigo-950/40 border border-indigo-500/30 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Award size={14} className="animate-pulse" />
            Accès Anticipé
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Votre portail se prépare !</h2>
          <p className="text-zinc-300 leading-relaxed">
            Dès validation finale de votre inscription et de vos financements (CPF, AIF ou Plan), vous accéderez à votre espace interactif complet : exercices de préparation, suivi de niveau en temps réel et accompagnement premium.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/mon-espace/dossier"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
            >
              Consulter mon dossier
            </Link>
            <Link
              to="/mon-espace/documents"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-sm active:scale-[0.98] transition-all"
            >
              Mes pièces justificatives
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 hover:border-zinc-700 p-6 rounded-2xl transition-all duration-200 group">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen size={22} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Cours & Exercices</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Accédez à notre bibliothèque d'entraînements linguistiques de niveau A2 à B2 pour préparer votre attestation.
          </p>
          <div className="mt-4 text-xs font-semibold text-indigo-400 uppercase tracking-wider group-hover:underline">Bientôt disponible →</div>
        </div>

        {/* Card 2 */}
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 hover:border-zinc-700 p-6 rounded-2xl transition-all duration-200 group">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={22} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mon Dossier Administratif</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Vérifiez l'avancement de votre dossier en préfecture et restez notifié(e) de chaque étape de traitement.
          </p>
          <div className="mt-4 text-xs font-semibold text-amber-400 uppercase tracking-wider group-hover:underline">Bientôt disponible →</div>
        </div>

        {/* Card 3 */}
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 hover:border-zinc-700 p-6 rounded-2xl transition-all duration-200 group">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <User size={22} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mon Conseiller Dédié</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Un interlocuteur unique pour répondre à vos interrogations sur vos cours et vos prises en charge.
          </p>
          <div className="mt-4 text-xs font-semibold text-emerald-400 uppercase tracking-wider group-hover:underline">Bientôt disponible →</div>
        </div>
      </div>
    </div>
  );
}
