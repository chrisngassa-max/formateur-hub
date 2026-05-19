import { ArrowLeft, Clock, FileCheck2, ShieldCheck, User } from "lucide-react";
import { Link } from "react-router-dom";

export function InscritDossier() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Navigation */}
      <Link to="/mon-espace" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={16} />
        Retour au tableau de bord
      </Link>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Éléments du profil</span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Mon Dossier Unique</h1>
        <p className="text-zinc-400 mt-1">Détails de vos qualifications de français et de vos démarches administratives.</p>
      </div>

      {/* Glassmorphic Alert Box */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 p-6 rounded-2xl flex gap-4 items-start shadow-xl">
        <Clock className="text-amber-500 shrink-0 mt-0.5" size={24} />
        <div className="space-y-1">
          <h4 className="font-bold text-white text-lg">Dossier en attente d'activation</h4>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Vos informations de positionnement TCF/IRN et vos pièces d'identité seront auditées de manière approfondie dès le début de votre formation avec nos formateurs habilités.
          </p>
        </div>
      </div>

      {/* Profile Details List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <User className="text-indigo-400" size={22} />
          Informations de qualification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
            <span className="text-xs text-zinc-500 uppercase font-black">Niveau Linguistique Provisoire</span>
            <div className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
              A2 / B1
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Indicatif</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Calculé suite à votre test de positionnement autonome en ligne.</p>
          </div>

          <div className="space-y-2 p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
            <span className="text-xs text-zinc-500 uppercase font-black">Démarche Préfectorale Déclarée</span>
            <div className="text-lg font-bold text-white tracking-tight mt-1">
              Carte de résident 10 ans / Naturalisation
            </div>
            <p className="text-xs text-zinc-400 mt-1">Sujet à accompagnement et validation administrative.</p>
          </div>
        </div>

        {/* Audit Disclaimer */}
        <div className="pt-4 border-t border-zinc-800 flex items-start gap-3">
          <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong>Sécurité & Traçabilité :</strong> Conformément à notre politique de confidentialité, toutes les modifications apportées à votre dossier sont journalisées de manière sécurisée et ne sont transmises à aucun organisme tiers sans votre consentement explicite horodaté.
          </p>
        </div>
      </div>
    </div>
  );
}
