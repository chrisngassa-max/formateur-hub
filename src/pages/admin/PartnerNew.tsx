import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth";
import { 
  ArrowLeft, 
  Handshake, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Check, 
  Loader2 
} from "lucide-react";

export function PartnerNew() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  
  // Services (types selection)
  const [serviceTypes, setServiceTypes] = useState({
    carte_sejour: false,
    resident: false,
    naturalisation: false,
    autre: false,
  });

  // Transmission mode
  const [transmissionMode, setTransmissionMode] = useState<"manual_csv" | "manual_pdf" | "email" | "future_api">("manual_csv");
  
  // Legal checks
  const [kbisVerified, setKbisVerified] = useState(false);
  const [insuranceVerified, setInsuranceVerified] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [contractSignedAt, setContractSignedAt] = useState("");
  const [legalNotes, setLegalNotes] = useState("");

  // Security Gate
  if (!isAdmin) return <Navigate to="/" replace />;

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    
    // Generate simple slug (lowercase, alphanum, replaces spaces/special with hyphen)
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-");
      
    setSlug(generatedSlug);
  };

  const handleServiceChange = (key: keyof typeof serviceTypes) => {
    setServiceTypes({
      ...serviceTypes,
      [key]: !serviceTypes[key],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);

    try {
      // Map active service types to string array
      const activeServices = Object.entries(serviceTypes)
        .filter(([_, isChecked]) => isChecked)
        .map(([key]) => key);

      const newPartner = {
        name: name.trim(),
        slug: slug.trim(),
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_whatsapp: contactWhatsapp.trim() || null,
        status: "draft", // Draft by default
        service_types: activeServices,
        transmission_mode: transmissionMode,
        requires_manual_export: transmissionMode === "manual_csv" || transmissionMode === "manual_pdf",
        kbis_verified: kbisVerified,
        insurance_verified: insuranceVerified,
        contract_signed: contractSigned,
        contract_signed_at: contractSigned && contractSignedAt ? new Date(contractSignedAt).toISOString() : null,
        legal_notes: legalNotes.trim() || null,
      };

      const { error } = await (supabase as any)
        .from("partners")
        .insert(newPartner);

      if (error) throw error;

      navigate("/admin/partenaires");
    } catch (err) {
      console.error("[PartnerNew] Failed to save partner:", err);
      alert("Une erreur est survenue lors de l'enregistrement du partenaire.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Back link */}
      <div>
        <Link 
          to="/admin/partenaires" 
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-950 font-bold text-sm bg-white border border-zinc-200 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={16} />
          Retour aux partenaires
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
          <Handshake size={14} /> Nouveau cabinet
        </p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900">
          Ajouter un partenaire
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Le cabinet sera créé en statut **En préparation (Draft)** par défaut.
        </p>
      </header>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-8 max-w-4xl">
        
        {/* Section 1: Identity */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">1</span>
            Identité & Contacts
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-bold text-zinc-600 uppercase">Nom du cabinet conseil *</label>
              <input
                type="text"
                id="name"
                required
                placeholder="Ex: Cabinet ABC Consult"
                value={name}
                onChange={handleNameChange}
                className="w-full h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="slug" className="text-xs font-bold text-zinc-600 uppercase">Identifiant technique (Slug)</label>
              <input
                type="text"
                id="slug"
                readOnly
                placeholder="slug-genere-automatiquement"
                value={slug}
                className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-zinc-100 text-zinc-500 font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contact_name" className="text-xs font-bold text-zinc-600 uppercase">Nom du contact principal</label>
              <input
                type="text"
                id="contact_name"
                placeholder="Ex: Sofiane Martin"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contact_email" className="text-xs font-bold text-zinc-600 uppercase">Adresse Email</label>
              <input
                type="email"
                id="contact_email"
                placeholder="contact@cabinet.fr"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="contact_whatsapp" className="text-xs font-bold text-zinc-600 uppercase">Téléphone WhatsApp (avec indicatif)</label>
              <input
                type="tel"
                id="contact_whatsapp"
                placeholder="+33 6 12 34 56 78"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                className="w-full h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Services */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">2</span>
            Services proposés par le cabinet
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={serviceTypes.carte_sejour}
                onChange={() => handleServiceChange("carte_sejour")}
                className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-800">Carte de séjour pluriannuelle</span>
                <span className="text-[11px] text-zinc-500">Accompagnement dossiers 2 à 4 ans</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={serviceTypes.resident}
                onChange={() => handleServiceChange("resident")}
                className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-800">Carte de résident / 10 ans</span>
                <span className="text-[11px] text-zinc-500">Demande de renouvellement longue durée</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={serviceTypes.naturalisation}
                onChange={() => handleServiceChange("naturalisation")}
                className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-800">Naturalisation</span>
                <span className="text-[11px] text-zinc-500">Dossiers d'accès à la nationalité</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={serviceTypes.autre}
                onChange={() => handleServiceChange("autre")}
                className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-800">Autre démarche</span>
                <span className="text-[11px] text-zinc-500">Recours, regroupement familial, etc.</span>
              </div>
            </label>
          </div>
        </section>

        {/* Section 3: Mode de transmission */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">3</span>
            Mode de transmission
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 border border-zinc-250 bg-amber-50/20 rounded-xl cursor-pointer hover:bg-amber-50/30 transition-colors">
              <input
                type="radio"
                name="transmissionMode"
                value="manual_csv"
                checked={transmissionMode === "manual_csv"}
                onChange={() => setTransmissionMode("manual_csv")}
                className="mt-1 border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-amber-800">Export CSV manuel (Recommandé V1)</span>
                <span className="text-xs text-amber-700 mt-0.5 leading-normal">
                  Les leads sont collectés en base. L'administrateur les exporte de façon auditable dans un fichier XLSX/CSV et les transmet manuellement.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <input
                type="radio"
                name="transmissionMode"
                value="manual_pdf"
                checked={transmissionMode === "manual_pdf"}
                onChange={() => setTransmissionMode("manual_pdf")}
                className="mt-1 border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-800">Export PDF individuel</span>
                <span className="text-xs text-zinc-500 mt-0.5 leading-normal">
                  Génération d'une fiche récapitulative au format PDF pour chaque prospect à envoyer manuellement.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <input
                type="radio"
                name="transmissionMode"
                value="email"
                checked={transmissionMode === "email"}
                onChange={() => setTransmissionMode("email")}
                className="mt-1 border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-800">Envoi direct par Email</span>
                <span className="text-xs text-zinc-500 mt-0.5 leading-normal">
                  (Futur) Déclenche un email transactionnel sécurisé à destination du cabinet conseil tiers lors de chaque opt-in.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <input
                type="radio"
                name="transmissionMode"
                value="future_api"
                checked={transmissionMode === "future_api"}
                onChange={() => setTransmissionMode("future_api")}
                className="mt-1 border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-800">API Webhook</span>
                <span className="text-xs text-zinc-500 mt-0.5 leading-normal">
                  (Futur) Envoi immédiat en format JSON structuré vers le CRM ou le serveur du cabinet conseil.
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* Section 4: Juridique */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">4</span>
            Vérifications Juridiques & Pièces
          </h3>
          
          <div className="bg-zinc-55 bg-zinc-50/50 p-5 rounded-2xl border border-zinc-200 grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className="flex flex-col gap-2 p-3 bg-white border border-zinc-200 rounded-xl hover:border-amber-300 transition-colors cursor-pointer select-none">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={kbisVerified}
                  onChange={(e) => setKbisVerified(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
                />
                <span className="text-xs font-bold text-zinc-700 uppercase">KBIS Vérifié</span>
              </div>
              <p className="text-[11px] text-zinc-400 pl-7 leading-normal">
                Vérification de l'existence légale et du dirigeant.
              </p>
            </label>

            <label className="flex flex-col gap-2 p-3 bg-white border border-zinc-200 rounded-xl hover:border-amber-300 transition-colors cursor-pointer select-none">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={insuranceVerified}
                  onChange={(e) => setInsuranceVerified(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
                />
                <span className="text-xs font-bold text-zinc-700 uppercase">Responsabilité Civile</span>
              </div>
              <p className="text-[11px] text-zinc-400 pl-7 leading-normal">
                Attestation d'assurance RCP valide fournie.
              </p>
            </label>

            <label className="flex flex-col gap-2 p-3 bg-white border border-zinc-200 rounded-xl hover:border-amber-300 transition-colors cursor-pointer select-none">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={contractSigned}
                  onChange={(e) => setContractSigned(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4.5 w-4.5"
                />
                <span className="text-xs font-bold text-zinc-700 uppercase">Contrat Partenaire</span>
              </div>
              <p className="text-[11px] text-zinc-400 pl-7 leading-normal">
                Contrat de partenariat commercial signé par les deux parties.
              </p>
            </label>

            {contractSigned && (
              <div className="md:col-span-3 space-y-1 border-t border-zinc-200/50 pt-4 animate-in fade-in duration-200">
                <label htmlFor="contract_signed_at" className="text-xs font-bold text-zinc-650 uppercase">Date de signature du contrat *</label>
                <input
                  type="date"
                  id="contract_signed_at"
                  required={contractSigned}
                  value={contractSignedAt}
                  onChange={(e) => setContractSignedAt(e.target.value)}
                  className="w-full max-w-[300px] h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Notes & Override */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">5</span>
            Clauses, notes & commentaires
          </h3>
          
          <div className="space-y-2">
            <label htmlFor="legal_notes" className="text-xs font-bold text-zinc-600 uppercase">Notes internes (justificatifs, conventions, limites de compétence)</label>
            <textarea
              id="legal_notes"
              rows={4}
              placeholder="Ex: RC Pro MMA n° 14856699. Cabinet habilité conseil étranger en préfecture, ne gère pas les visas d'étudiants de moins de 18 ans."
              value={legalNotes}
              onChange={(e) => setLegalNotes(e.target.value)}
              className="w-full p-3 border border-zinc-250 rounded-lg text-sm bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
        </section>

        {/* Action Button */}
        <div className="flex gap-4 border-t border-zinc-100 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white font-bold text-sm px-6 hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Enregistrer en mode préparation
              </>
            )}
          </button>

          <Link
            to="/admin/partenaires"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-250 bg-white text-zinc-700 font-bold text-sm px-6 hover:bg-zinc-50 transition-all"
          >
            Annuler
          </Link>
        </div>

      </form>

    </div>
  );
}
