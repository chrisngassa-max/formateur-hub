import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth";
import { 
  ArrowLeft, 
  User, 
  Smartphone, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Clock, 
  Loader2,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Send,
  EyeOff
} from "lucide-react";

interface Lead {
  id: string;
  first_name: string;
  partner_request_type?: string | null;
  message?: string | null;
  status: string;
  partner_id?: string | null;
  appointment_date?: string | null;
  created_at: string;
}

interface LeadEvent {
  id: string;
  event_name: string;
  properties: any;
  created_at: string;
}

export function PartnerDossierDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [partner, setPartner] = useState<any | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form actions
  const [currentStatus, setCurrentStatus] = useState("");
  const [followupNote, setFollowupNote] = useState("");

  // Normaliser le numéro WhatsApp pour wa.me
  const getWhatsAppLink = (phone?: string | null) => {
    if (!phone) return "";
    // Garde uniquement les chiffres
    let cleaned = phone.replace(/[^0-9]/g, "");
    // Si commence par un 0 (ex: 0612345678), le remplacer par l'indicatif français 33
    if (cleaned.startsWith("0")) {
      cleaned = "33" + cleaned.substring(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  async function loadDossier() {
    if (!user?.email || !id) return;

    try {
      // 1. Resolve Partner
      const { data: partnerData } = await (supabase as any)
        .from("partners")
        .select("*")
        .eq("contact_email", user.email)
        .maybeSingle();

      if (!partnerData) {
        setLoading(false);
        return;
      }
      setPartner(partnerData);

      // 2. Fetch Lead detail
      const { data: leadData, error: leadError } = await (supabase as any)
        .from("leads")
        .select("id, first_name, partner_request_type, message, status, partner_id, appointment_date, created_at")
        .eq("id", id)
        .single();

      if (leadError || !leadData) {
        setLead(null);
        setLoading(false);
        return;
      }

      // Security check: Verify that this lead belongs to the logged-in partner
      if (leadData.partner_id !== partnerData.id) {
        setLead(null); // Access denied
        setLoading(false);
        return;
      }

      setLead(leadData);
      setCurrentStatus(leadData.status || "nouveau");

      // 3. Fetch Events associated with this lead
      const { data: eventsData } = await (supabase as any)
        .from("lead_events")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      setEvents(eventsData || []);

      // 4. Track Audit Event: "partenaire_fiche_ouverte"
      await (supabase as any).from("lead_events").insert({
        lead_id: id,
        event_name: "partenaire_fiche_ouverte",
        properties: { 
          partner_id: partnerData.id, 
          partner_name: partnerData.name,
          user_email: user.email
        }
      });

    } catch (err) {
      console.error("[PartnerDossierDetail] Error loading dossier:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDossier();
  }, [user, id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !lead || !partner) return;

    setSubmitting(true);
    try {
      // 1. Update status
      const { error: updateError } = await (supabase as any)
        .from("leads")
        .update({ status: currentStatus })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Insert timeline notes if entered
      if (followupNote.trim()) {
        const { error: eventError } = await (supabase as any)
          .from("lead_events")
          .insert({
            lead_id: id,
            event_name: "manual_note",
            properties: { 
              content: followupNote.trim(), 
              author: partner.name,
              role: "partner"
            }
          });

        if (eventError) throw eventError;
        setFollowupNote("");
      }

      // 3. Log status change event if modified
      if (currentStatus !== lead.status) {
        await (supabase as any).from("lead_events").insert({
          lead_id: id,
          event_name: "status_updated",
          properties: { 
            status: currentStatus, 
            previous: lead.status,
            author: partner.name 
          }
        });
      }

      // Reload
      await loadDossier();
      alert("Le dossier a été mis à jour avec succès !");
    } catch (err) {
      console.error("[PartnerDossierDetail] Failed to update dossier:", err);
      alert("Une erreur est survenue lors de la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!id || !lead || !partner) return;
    try {
      // Update partner_transmissions table to "acknowledged"
      const { error } = await (supabase as any)
        .from("partner_transmissions")
        .update({ status: "acknowledged" })
        .eq("lead_id", id)
        .eq("partner_id", partner.id);

      if (error) throw error;

      // Log event
      await (supabase as any).from("lead_events").insert({
        lead_id: id,
        event_name: "manual_note",
        properties: { 
          content: "Accusé de réception validé par le partenaire. Dossier bien reçu.", 
          author: partner.name 
        }
      });

      alert("Accusé de réception enregistré !");
      await loadDossier();
    } catch (err) {
      console.error("[PartnerDossierDetail] Acknowledge failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Chargement de la fiche dossier...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl shadow-sm max-w-2xl mx-auto mt-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-zinc-900 mb-1">Dossier non autorisé ou introuvable</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto px-4">
          Vous n'avez pas l'autorisation d'accéder à ce dossier, ou celui-ci n'a pas été assigné à votre cabinet.
        </p>
        <Link to="/partenaire" className="inline-flex items-center gap-1.5 text-amber-600 font-semibold text-sm mt-4 hover:underline">
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
      </div>
    );
  }

  // Fetch WhatsApp Phone from first event lead captured or transmission snapshot
  const rawWhatsApp = events.find(e => e.event_name === "lead_captured")?.properties?.whatsapp_phone 
    || events.find(e => e.event_name === "lead_transmis_partenaire")?.properties?.whatsapp_phone;

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Back button */}
      <div>
        <Link 
          to="/partenaire" 
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-950 font-bold text-sm bg-white border border-zinc-200 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={16} />
          Retour au tableau de bord
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Info & Update form */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-6">
              <div className="space-y-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  Dossier Partenaire
                </span>
                <h3 className="text-2xl font-black text-zinc-900 mt-2">
                  Dossier de {lead.first_name}
                </h3>
                <p className="text-xs text-zinc-450">
                  Transmis le {new Date(lead.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs px-4 transition-all"
                >
                  <CheckCircle size={14} />
                  Accuser réception
                </button>
              </div>
            </div>

            {/* Fields detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Prénom</span>
                <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                  <User size={16} className="text-zinc-500" />
                  {lead.first_name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Type de Démarche</span>
                <p className="text-sm font-bold text-zinc-800">
                  {lead.partner_request_type === "carte_sejour" && "Carte de séjour pluriannuelle"}
                  {lead.partner_request_type === "resident" && "Carte de résident / 10 ans"}
                  {lead.partner_request_type === "naturalisation" && "Naturalisation (Accès nationalité)"}
                  {lead.partner_request_type === "autre" && "Autre démarche préfecture"}
                  {!lead.partner_request_type && "Non spécifiée"}
                </p>
              </div>

              {/* RÈGLES STRICTES DE CONFIDENTIALITÉ (RGPD) */}
              <div className="space-y-1 p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                  <EyeOff size={11} className="text-zinc-400" />
                  Adresse Email
                </span>
                <p className="text-xs font-semibold text-zinc-500 italic mt-0.5">
                  Masqué par sécurité (RGPD)
                </p>
              </div>

              <div className="space-y-1 p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                  <EyeOff size={11} className="text-zinc-400" />
                  Niveau linguistique estimé
                </span>
                <p className="text-xs font-semibold text-zinc-500 italic mt-0.5">
                  Non partagé avec le partenaire
                </p>
              </div>

              {/* WhatsApp direct contact */}
              <div className="md:col-span-2 space-y-2 border-t border-zinc-100 pt-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Contact Direct Candidat</span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Smartphone className="text-emerald-600" size={20} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800">Contacter via WhatsApp</span>
                      <span className="text-[10px] text-zinc-500">Un lien direct wa.me sécurisé a été normalisé pour vous.</span>
                    </div>
                  </div>

                  <a
                    href={getWhatsAppLink(rawWhatsApp || "+33600000000")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 shadow transition-all active:scale-95"
                  >
                    Ouvrir WhatsApp →
                  </a>
                </div>
              </div>

              {/* Candidate message if supplied */}
              {lead.message && (
                <div className="md:col-span-2 space-y-1 border-t border-zinc-100 pt-4">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Message du candidat</span>
                  <p className="text-xs text-zinc-650 bg-zinc-50 border border-zinc-150 p-3 rounded-lg leading-relaxed">
                    {lead.message}
                  </p>
                </div>
              )}

              {/* Appointment date indicator */}
              {lead.appointment_date && (
                <div className="md:col-span-2 space-y-1 border-t border-zinc-100 pt-4 flex items-center gap-2">
                  <Calendar size={14} className="text-amber-600" />
                  <p className="text-xs font-semibold text-zinc-700">
                    Rendez-vous préfecture programmé le : <span className="font-bold text-zinc-950">{new Date(lead.appointment_date).toLocaleDateString("fr-FR")}</span>
                  </p>
                </div>
              )}

            </div>

            {/* Form actions: update status & add Note */}
            <form onSubmit={handleSave} className="border-t border-zinc-150 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mettre à jour le dossier</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="status" className="text-[10px] font-bold text-zinc-500 uppercase">Statut d'accompagnement *</label>
                  <select
                    id="status"
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                    className="w-full h-10 px-3 border border-zinc-250 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="exported">Nouveau (Non contacté)</option>
                    <option value="en_cours">En cours de traitement</option>
                    <option value="contact_effectue">Contact effectué</option>
                    <option value="dossier_recu">Dossier reçu</option>
                    <option value="en_attente_piece">Pièce manquante</option>
                    <option value="traite">Accompagnement terminé (Traité)</option>
                    <option value="sans_suite">Sans suite</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="followup_note" className="text-[10px] font-bold text-zinc-500 uppercase">Ajouter un compte-rendu ou une note</label>
                  <textarea
                    id="followup_note"
                    placeholder="Saisissez vos observations suite aux échanges..."
                    rows={3}
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                    className="w-full p-3 border border-zinc-250 rounded-lg text-xs bg-zinc-50/20 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-5 shadow transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </form>

          </div>

        </div>

        {/* Right column: Treatment timeline history */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-zinc-850 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Clock size={16} className="text-zinc-500" />
              Suivi du dossier
            </h3>

            {events.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-4">Aucun historique disponible.</p>
            ) : (
              <div className="relative pl-6 border-l border-zinc-200 space-y-6">
                {events.map((ev) => {
                  return (
                    <div key={ev.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1 h-4.5 w-4.5 rounded-full border-2 border-white bg-zinc-250 flex items-center justify-center shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-650"></span>
                      </span>

                      <div className="flex justify-between items-start gap-4">
                        <p className="text-xs font-bold text-zinc-800">
                          {ev.event_name === "status_updated" && "Statut modifié"}
                          {ev.event_name === "manual_note" && "Note ajoutée"}
                          {ev.event_name === "partenaire_fiche_ouverte" && "Fiche consultée"}
                          {ev.event_name === "lead_transmis_partenaire" && "Dossier attribué"}
                          {ev.event_name !== "status_updated" && ev.event_name !== "manual_note" && ev.event_name !== "partenaire_fiche_ouverte" && ev.event_name !== "lead_transmis_partenaire" && ev.event_name}
                        </p>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                          {ev.created_at ? new Date(ev.created_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </span>
                      </div>

                      {ev.event_name === "manual_note" && ev.properties?.content && (
                        <p className="text-[11px] text-zinc-650 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 leading-relaxed">
                          {ev.properties.content}
                          {ev.properties.author && <span className="block mt-1 text-[9px] text-zinc-450 text-right">— {ev.properties.author}</span>}
                        </p>
                      )}

                      {ev.event_name === "status_updated" && ev.properties?.status && (
                        <p className="text-[11px] text-zinc-500">
                          Statut : <span className="font-bold text-zinc-800">{ev.properties.status}</span>
                        </p>
                      )}

                      {ev.event_name === "partenaire_fiche_ouverte" && (
                        <p className="text-[10px] text-zinc-400 italic">
                          Consulté par {ev.properties?.user_email || "le cabinet"}
                        </p>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
