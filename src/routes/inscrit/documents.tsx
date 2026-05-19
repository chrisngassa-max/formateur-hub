import { ArrowLeft, Clock, FileCheck, FileX, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";

export function InscritDocuments() {
  const mockDocuments = [
    { name: "Pièce d'identité (CNI ou Titre de séjour)", required: true, status: "pending" },
    { name: "Justificatif de domicile de moins de 3 mois", required: true, status: "pending" },
    { name: "Attestation de réussite linguistique (optionnel)", required: false, status: "pending" }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Navigation */}
      <Link to="/mon-espace" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={16} />
        Retour au tableau de bord
      </Link>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Pièces Justificatives</span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Mes Documents administratifs</h1>
        <p className="text-zinc-400 mt-1">Déposez et organisez vos pièces requises pour vos demandes officielles.</p>
      </div>

      {/* Upload Info banner */}
      <div className="bg-zinc-900/50 backdrop-blur border border-dashed border-zinc-800 p-8 rounded-3xl text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center animate-bounce">
          <UploadCloud size={30} />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-bold text-white">Zone de dépôt inactive</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Le chargement et le cryptage sécurisé des pièces justificatives seront opérationnels dès le début effectif de vos sessions d'accompagnement.
          </p>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Liste des pièces exigées</h3>
        <div className="grid grid-cols-1 gap-4">
          {mockDocuments.map((doc, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm md:text-base">{doc.name}</h4>
                  {doc.required ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Obligatoire
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Facultatif
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">Formats autorisés : PDF, PNG, JPG (Max 5Mo)</p>
              </div>

              <div className="flex items-center gap-2 text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <Clock size={14} className="text-zinc-400" />
                <span>En attente</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
