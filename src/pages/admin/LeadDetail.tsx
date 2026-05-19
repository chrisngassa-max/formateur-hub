import { useEffect, useState, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth";
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Mail, 
  Smartphone, 
  ShieldCheck, 
  MessageSquare, 
  FileText, 
  Send,
  Loader2,
  Calendar,
  AlertCircle,
  Activity,
  Handshake,
  Eye,
  ShieldAlert,
  CheckCircle
} from "lucide-react";
import { preparerTransmission } from "../../utils/transmission-partenaire";
import { exportPartnerLeadsCSV } from "../../utils/export-leads";

interface LeadEvent {
  id: string;
  event_name: string;
  properties: any;
  created_at: string;
}

interface LeadData {
  id: string;
  created_at: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  whatsapp_phone?: string | null;
  lead_type: string;
  source: string;
  estimated_level?: string | null;
  partner_request_type?: string | null;
  message?: string | null;
  consent_training: boolean;
  consent_partner: boolean;
  consent_training_text_version?: string | null;
  consent_partner_text_version?: string | null;
  consent_timestamp?: string | null;
  status?: string | null;
  partner_status?: string | null;
  partner_id?: string | null;
  appointment_date?: string | null;
}

interface PartnerTransmission {
  id: string;
  created_at: string;
  transmission_mode: string;
  transmitted_by: string;
  payload_snapshot: any;
  consent_snapshot: any;
  status: string;
  transmitted_at?: string | null;
  notes?: string | null;
  partners?: { name: string } | null;
}

export function LeadDetail() {
  const { isGestionnaire } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<LeadData | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual event state
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Partner Transmission state
  const [activePartners, setActivePartners] = useState<any[]>([]);
  const [transmissions, setTransmissions] = useState<PartnerTransmission[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [transMode, setTransMode] = useState<"manual_csv" | "manual_pdf" | "email">("manual_csv");
  const [transNotes, setTransNotes] = useState("");
  const [transmitting, setTransmitting] = useState(false);
  const [showSnapshotsModal, setShowSnapshotsModal] = useState<PartnerTransmission | null>(null);

  if (!isGestionnaire) return <Navigate to="/" replace />;

  async function loadLeadData() {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch Lead
      const { data: leadData, error: leadError } = await (supabase as any)
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // 2. Fetch Events
      const { data: eventData, error: eventError } = await (supabase as any)
        .from("lead_events")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      if (eventError) throw eventError;
      setEvents(eventData || []);

      // 3. Fetch Transmissions (defensive catch)
      try {
        const { data: transData, error: transError } = await (supabase as any)
          .from("partner_transmissions")
          .select("*, partners(name)")
          .eq("lead_id", id);
        
        if (!transError && transData) {
          setTransmissions(transData);
        }
      } catch (transErr) {
        console.warn("[LeadDetail] Failed to load partner transmissions:", transErr);
      }

      // 4. Fetch Active Partners (defensive catch)
      try {
        const { data: activePData, error: activePError } = await (supabase as any)
          .from("partners")
          .select("*")
          .eq("status", "active");

        if (!activePError && activePData) {
          setActivePartners(activePData);
          if (activePData.length > 0) {
            setSelectedPartnerId(activePData[0].id);
          }
        }
      } catch (pErr) {
        console.warn("[LeadDetail] Failed to load active partners:", pErr);
      }

    } catch (err) {
      console.error("[LeadDetail] Error loading lead data:", err);
    } finally {
      setLoading(false);
    }
  }

  const currentTransmission = useMemo(() => {
    if (transmissions.length === 0) return null;
    return transmissions[transmissions.length - 1];
  }, [transmissions]);

  const activeStep = useMemo(() => {
    if (!lead) return 1;
    if (!lead.consent_partner || activePartners.length === 0) return 1;
    if (!lead.partner_id) return 2;
    if (!currentTransmission) return 3;
    if (currentTransmission.status === "prepared") return 4;
    if (currentTransmission.status === "sent" || currentTransmission.status === "acknowledged") return 5;
    return 2;
  }, [lead, activePartners, transmissions, currentTransmission]);

  const handleTransmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedPartnerId || !lead) return;
    
    setTransmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Utilisateur authentifié introuvable.");

      const partner = activePartners.find(p => p.id === selectedPartnerId);
      const partnerSlug = partner?.slug || "partner";

      await preparerTransmission({
        lead_id: id,
        partner_id: selectedPartnerId,
        transmitted_by: currentUser.id,
        mode: transMode,
        notes: transNotes.trim()
      });

      // Télécharger l'export XLSX/CSV automatique
      exportPartnerLeadsCSV([lead], partnerSlug);

      setTransNotes("");
      
      // Reload lead details and transmissions
      await loadLeadData();
      alert(`Dossier préparé et export téléchargé pour ${partner?.name || 'le partenaire'} !`);
    } catch (err: any) {
      console.error("[LeadDetail] Transmission failed:", err);
      alert(err.message || "Échec de la transmission.");
    } finally {
      setTransmitting(false);
    }
  };

  const handleMarkAsSent = async () => {
    if (!currentTransmission || !lead) return;
    try {
      const nowStr = new Date().toISOString();
      const { error: transErr } = await (supabase as any)
        .from("partner_transmissions")
        .update({ status: "sent", transmitted_at: nowStr })
        .eq("id", currentTransmission.id);

      if (transErr) throw transErr;

      // Update lead partner_status
      const { error: leadErr } = await (supabase as any)
        .from("leads")
        .update({ partner_status: "transmitted" })
        .eq("id", lead.id);

      if (leadErr) throw leadErr;

      // Log event
      await (supabase as any).from("lead_events").insert({
        lead_id: lead.id,
        event_name: "manual_note",
        properties: { content: `Dossier marqué comme envoyé au partenaire (${currentTransmission.partners?.name || 'Cabinet'}).`, author: "Admin" }
      });

      alert("Dossier marqué comme envoyé !");
      await loadLeadData();
    } catch (err) {
      console.error("[LeadDetail] Mark as sent failed:", err);
      alert("Échec de la mise à jour.");
    }
  };

  const handleForceAcknowledge = async () => {
    if (!currentTransmission || !lead) return;
    try {
      const { error: transErr } = await (supabase as any)
        .from("partner_transmissions")
        .update({ status: "acknowledged" })
        .eq("id", currentTransmission.id);

      if (transErr) throw transErr;

      // Log event
      await (supabase as any).from("lead_events").insert({
        lead_id: lead.id,
        event_name: "manual_note",
        properties: { content: `Accusé de réception forcé par l'administrateur. Dossier bien reçu par le partenaire.`, author: "Admin" }
      });

      alert("Accusé de réception validé !");
      await loadLeadData();
    } catch (err) {
      console.error("[LeadDetail] Force acknowledge failed:", err);
    }
  };

  useEffect(() => {
    loadLeadData();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead || !id) return;
    setActionLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("leads")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Log event
      const { error: eventErr } = await (supabase as any).from("lead_events").insert({
        lead_id: id,
        event_name: "status_updated",
        properties: { status: newStatus, previous: lead.status }
      });

      if (eventErr) throw eventErr;

      setLead({ ...lead, status: newStatus });
      
      // Reload events to show status update immediately
      const { data: eventData } = await (supabase as any)
        .from("lead_events")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      setEvents(eventData || []);
    } catch (err) {
      console.error("[LeadDetail] Error updating status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddManualNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !id) return;
    setSubmittingNote(true);

    try {
      const { error } = await (supabase as any).from("lead_events").insert({
        lead_id: id,
        event_name: "manual_note",
        properties: { content: noteContent.trim() }
      });

      if (error) throw error;

      setNoteContent("");

      // Reload events
      const { data: eventData } = await (supabase as any)
        .from("lead_events")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      setEvents(eventData || []);
    } catch (err) {
      console.error("[LeadDetail] Error adding note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Chargement de la fiche...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-zinc-900 mb-1">Prospect introuvable</h3>
        <p className="text-sm text-zinc-500">La fiche prospect que vous recherchez n'existe pas ou a été supprimée.</p>
        <Link to="/admin/leads" className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-sm mt-4 hover:underline">
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Back Button */}
      <div>
        <Link 
          to="/admin/leads" 
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-950 font-bold text-sm bg-white border border-zinc-200 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={16} />
          Retour aux prospects
        </Link>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Lead Info Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Identity & Details */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-6">
                <div className="space-y-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    lead.source === "bilan_post_result" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                  }`}>
                    {lead.source === "bilan_post_result" ? "Diagnostic Français" : "Accompagnement Admin"}
                  </span>
                  <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                    {lead.first_name} {lead.last_name || ""}
                  </h1>
                  <p className="text-xs text-zinc-400 font-mono">ID: {lead.id}</p>
                </div>

                {/* Status select/edit */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Statut :</span>
                  <select
                    value={lead.status || "new"}
                    disabled={actionLoading}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-zinc-50/50 hover:bg-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[140px]"
                  >
                    <option value="new">Nouveau</option>
                    <option value="contacted">Contacté</option>
                    <option value="qualified">Qualifié</option>
                    <option value="exported">Exporté</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              </div>

              {/* Grid with metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Contact information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
                    Coordonnées
                  </h3>
                  
                  <div className="space-y-3">
                    {lead.email && (
                      <div className="flex items-center gap-3 text-zinc-800">
                        <div className="h-9 w-9 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-200 shrink-0">
                          <Mail size={16} className="text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 font-semibold uppercase">Adresse Email</p>
                          <a href={`mailto:${lead.email}`} className="text-sm font-medium text-indigo-600 hover:underline">{lead.email}</a>
                        </div>
                      </div>
                    )}

                    {lead.whatsapp_phone && (
                      <div className="flex items-center gap-3 text-zinc-800">
                        <div className="h-9 w-9 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-200 shrink-0">
                          <Smartphone size={16} className="text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 font-semibold uppercase">Numéro WhatsApp</p>
                          <a href={`tel:${lead.whatsapp_phone}`} className="text-sm font-medium text-indigo-600 hover:underline">{lead.whatsapp_phone}</a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-zinc-800">
                      <div className="h-9 w-9 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-200 shrink-0">
                        <Calendar size={16} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-semibold uppercase">Date d'inscription</p>
                        <p className="text-sm font-semibold">{lead.created_at ? new Date(lead.created_at).toLocaleString("fr-FR") : "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile criteria */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
                    Profil & Critères
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-800">
                      <div className="h-9 w-9 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-200 shrink-0">
                        <FileText size={16} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-semibold uppercase">Type de Demande</p>
                        <p className="text-sm font-bold">
                          {lead.lead_type === "training" && "Formation"}
                          {lead.lead_type === "combined" && "Formation & Accompagnement Admin"}
                          {lead.lead_type === "admin_support" && "Accompagnement Admin"}
                        </p>
                      </div>
                    </div>

                    {lead.estimated_level && (
                      <div className="flex items-center gap-3 text-zinc-800">
                        <div className="h-9 w-9 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-200 shrink-0">
                          <Activity size={16} className="text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 font-semibold uppercase">Niveau Linguistique Estimé</p>
                          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold mt-0.5 border border-indigo-150">
                            Niveau {lead.estimated_level}
                          </span>
                        </div>
                      </div>
                    )}

                    {lead.partner_request_type && (
                      <div className="flex items-center gap-3 text-zinc-800">
                        <div className="h-9 w-9 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-200 shrink-0">
                          <ShieldCheck size={16} className="text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 font-semibold uppercase">Démarche administrative visée</p>
                          <p className="text-sm font-bold text-zinc-900">
                            {lead.partner_request_type === "carte_sejour" && "Carte de séjour pluriannuelle"}
                            {lead.partner_request_type === "resident" && "Carte de résident / 10 ans"}
                            {lead.partner_request_type === "naturalisation" && "Naturalisation par décret"}
                            {lead.partner_request_type === "je_ne_sais_pas" && "Je ne sais pas encore"}
                            {lead.partner_request_type === "autre" && "Autre démarche"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Message field if exists */}
              {lead.message && (
                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-150 space-y-2 mt-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-zinc-400" />
                    Message du prospect
                  </h4>
                  <p className="text-sm text-zinc-700 leading-relaxed font-medium">"{lead.message}"</p>
                </div>
              )}

            </div>
          </div>

          {/* Card: RGPD Proof of Consent */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <ShieldCheck size={20} className="text-emerald-600" />
              Preuves de Consentement RGPD
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Consent 1: Training */}
              <div className="bg-zinc-50/50 p-5 rounded-xl border border-zinc-200 space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Formation linguistique</h4>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${lead.consent_training ? "bg-emerald-500" : "bg-zinc-300"}`}></span>
                  <span className="text-sm font-semibold">{lead.consent_training ? "Consenti" : "Non collecté / refusé"}</span>
                </div>
                {lead.consent_training && (
                  <div className="text-xs text-zinc-500 space-y-1 pt-1.5 border-t border-zinc-200/60">
                    <p><strong>Version du texte :</strong> {lead.consent_training_text_version || "v1.0"}</p>
                    <p><strong>Horodatage :</strong> {lead.consent_timestamp ? new Date(lead.consent_timestamp).toLocaleString("fr-FR") : "-"}</p>
                  </div>
                )}
              </div>

              {/* Consent 2: Partner */}
              <div className="bg-zinc-50/50 p-5 rounded-xl border border-zinc-200 space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Accompagnement cabinet partenaire</h4>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${lead.consent_partner ? "bg-emerald-500" : "bg-zinc-300"}`}></span>
                  <span className="text-sm font-semibold">{lead.consent_partner ? "Consenti" : "Non collecté / refusé"}</span>
                </div>
                {lead.consent_partner && (
                  <div className="text-xs text-zinc-500 space-y-1 pt-1.5 border-t border-zinc-200/60">
                    <p><strong>Version du texte :</strong> {lead.consent_partner_text_version || "v1.0"}</p>
                    <p><strong>Horodatage :</strong> {lead.consent_timestamp ? new Date(lead.consent_timestamp).toLocaleString("fr-FR") : "-"}</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Card: Partner Transmissions */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Handshake size={20} className="text-indigo-600" />
              Transmissions Partenaire
            </h3>

            {!lead.consent_partner ? (
              <div className="bg-red-50/70 border border-red-200 p-5 rounded-xl flex gap-4 items-start shadow-sm">
                <ShieldAlert className="text-red-600 h-6 w-6 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-800">Aucun consentement partenaire</h4>
                  <p className="text-xs text-red-700 leading-relaxed font-medium">
                    Ce prospect n'a PAS consenti à la transmission de ses données à un cabinet conseil externe tiers. En conformité absolue avec le RGPD, toute transmission ou export pour partenaire est strictement interdite pour cette fiche.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Status / Assigned info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-zinc-50 border border-zinc-200 rounded-xl gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Statut d'assignation partenaire</span>
                    <span className="text-sm font-bold text-zinc-800">
                      {lead.partner_status === "unassigned" && "Non assigné"}
                      {lead.partner_status === "partner_requested_but_unassigned" && "Souhaite un accompagnement (Non assigné)"}
                      {lead.partner_status === "assigned" && "Assigné à un partenaire"}
                      {lead.partner_status === "transmitted" && "Transmis (Dossier envoyé)"}
                    </span>
                  </div>

                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    lead.partner_status === "assigned" || lead.partner_status === "transmitted" 
                      ? "bg-indigo-100 text-indigo-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {lead.partner_status === "assigned" || lead.partner_status === "transmitted" ? "Dossier traité" : "En attente"}
                  </span>
                </div>

                {/* If already assigned / has transmission history */}
                {transmissions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Historique des transmissions</h4>
                    
                    <div className="border border-zinc-150 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-500">
                            <th className="p-3">Date</th>
                            <th className="p-3">Partenaire</th>
                            <th className="p-3">Mode</th>
                            <th className="p-3">Statut</th>
                            <th className="p-3 text-right">Snapshots</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-zinc-700">
                          {transmissions.map((t) => (
                            <tr key={t.id} className="hover:bg-zinc-50/50">
                              <td className="p-3 font-medium text-zinc-500">
                                {t.transmitted_at ? new Date(t.transmitted_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                              </td>
                              <td className="p-3 font-bold text-zinc-800">
                                {t.partners?.name || "Cabinet Inconnu"}
                              </td>
                              <td className="p-3">
                                <span className="inline-flex px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                                  {t.transmission_mode === "manual_csv" ? "CSV" : t.transmission_mode === "manual_pdf" ? "PDF" : t.transmission_mode}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-emerald-700 font-bold uppercase">{t.status}</span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setShowSnapshotsModal(t)}
                                  className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                                >
                                  <Eye size={12} /> Voir Preuves
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* 5-Stage Interactive Transmission Process Wizard */}
                {activePartners.length === 0 ? (
                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl text-center text-xs text-amber-700 mt-6">
                    <p className="font-bold">Aucun partenaire actif configuré dans la console d'administration.</p>
                    <p className="mt-1 font-medium text-zinc-500">Activez un partenaire qualifié (avec KBIS et Contrat valides) dans "Gestion partenaires" pour pouvoir lui assigner ce dossier.</p>
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50 space-y-6 mt-6">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Activity size={14} className="text-indigo-600 animate-pulse" />
                      Tunnel d'accompagnement & Transmission (5 Étapes)
                    </h4>

                    {/* Visual Steps representation */}
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-zinc-400">
                      <div className={`p-2 rounded-lg border ${activeStep >= 1 ? "bg-emerald-50 text-emerald-800 border-emerald-250 font-bold" : "bg-white border-zinc-200"}`}>
                        1. Vérification
                      </div>
                      <div className={`p-2 rounded-lg border ${activeStep >= 2 ? "bg-indigo-50 text-indigo-800 border-indigo-250 font-bold" : "bg-white border-zinc-200"}`}>
                        2. Partenaire
                      </div>
                      <div className={`p-2 rounded-lg border ${activeStep >= 3 ? "bg-indigo-50 text-indigo-800 border-indigo-250 font-bold" : "bg-white border-zinc-200"}`}>
                        3. Préparation
                      </div>
                      <div className={`p-2 rounded-lg border ${activeStep >= 4 ? "bg-indigo-50 text-indigo-800 border-indigo-250 font-bold" : "bg-white border-zinc-200"}`}>
                        4. Envoi
                      </div>
                      <div className={`p-2 rounded-lg border ${activeStep >= 5 ? "bg-indigo-50 text-indigo-800 border-indigo-250 font-bold" : "bg-white border-zinc-200"}`}>
                        5. Réception
                      </div>
                    </div>

                    {/* Step details rendering */}
                    {activeStep === 1 && (
                      <div className="bg-red-50/70 border border-red-200 p-4 rounded-xl space-y-2 text-xs">
                        <p className="font-bold text-red-800">Étape 1 : Échec de la vérification automatique</p>
                        <p className="text-red-750 font-medium leading-relaxed">
                          Le prospect n'a pas consenti ou aucun partenaire actif n'a été trouvé. Veuillez vérifier les consentements légaux et le statut d'au moins un partenaire.
                        </p>
                      </div>
                    )}

                    {activeStep === 2 && (
                      <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-4 shadow-sm">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-zinc-800">Étape 2 : Sélectionner un partenaire actif</h5>
                          <p className="text-[11px] text-zinc-500">Choisissez le cabinet conseil partenaire qui accompagnera ce prospect.</p>
                        </div>

                        <div className="space-y-3">
                          {activePartners.map((p) => {
                            const isSelected = selectedPartnerId === p.id;
                            return (
                              <div 
                                key={p.id} 
                                onClick={() => setSelectedPartnerId(p.id)}
                                className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                                  isSelected ? "bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20" : "bg-zinc-50 border-zinc-200 hover:border-zinc-350"
                                }`}
                              >
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-zinc-900">{p.name}</p>
                                  <div className="flex gap-1.5 flex-wrap mt-1">
                                    {p.service_types?.map((s: string) => (
                                      <span key={s} className="px-1.5 py-0.5 rounded bg-zinc-200/60 text-[9px] font-bold text-zinc-605 uppercase">{s}</span>
                                    ))}
                                  </div>
                                </div>
                                <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-indigo-650 bg-indigo-650" : "border-zinc-300 bg-white"}`}>
                                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!selectedPartnerId) return;
                            try {
                              const { error } = await (supabase as any)
                                .from("leads")
                                .update({ partner_id: selectedPartnerId })
                                .eq("id", lead.id);

                              if (error) throw error;
                              await loadLeadData();
                            } catch (err) {
                              console.error("[LeadDetail] Assign partner failed:", err);
                            }
                          }}
                          disabled={!selectedPartnerId}
                          className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-650 text-white font-bold text-xs px-4 hover:bg-indigo-750 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                        >
                          <Handshake size={14} />
                          Affecter ce partenaire
                        </button>
                      </div>
                    )}

                    {activeStep === 3 && (
                      <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-4 shadow-sm">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-zinc-800">Étape 3 : Préparer la transmission</h5>
                          <p className="text-[11px] text-zinc-500">
                            Configurez les paramètres légaux, puis préparez le dossier et téléchargez le fichier d'export au format compatible Excel.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Mode de Transmission *</label>
                            <select
                              value={transMode}
                              onChange={(e) => setTransMode(e.target.value as any)}
                              className="w-full h-9 px-3 border border-zinc-250 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="manual_csv">Export CSV / Excel (Recommandé)</option>
                              <option value="manual_pdf">Fiche PDF</option>
                              <option value="email">Email direct automatique</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Notes d'accompagnement</label>
                            <textarea
                              placeholder="Entrez vos remarques destinées au partenaire..."
                              rows={2}
                              value={transNotes}
                              onChange={(e) => setTransNotes(e.target.value)}
                              className="w-full p-2.5 border border-zinc-250 rounded-lg text-xs bg-zinc-50/20 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleTransmit}
                          disabled={transmitting}
                          className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 text-white font-bold text-xs px-4 hover:bg-zinc-800 transition-all shadow-sm active:scale-[0.99]"
                        >
                          {transmitting ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Génération en cours...
                            </>
                          ) : (
                            <>
                              <FileText size={14} />
                              Préparer l'export & Télécharger XLSX
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {activeStep === 4 && (
                      <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-4 shadow-sm">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Étape 4 : Envoi du dossier au partenaire
                          </h5>
                          <p className="text-[11px] text-zinc-500">
                            Le dossier est préparé pour **{currentTransmission?.partners?.name || 'le partenaire'}** via le mode **{currentTransmission?.transmission_mode === 'manual_csv' ? 'Export CSV / Excel' : 'Email Direct'}**.
                          </p>
                        </div>

                        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-650 leading-normal space-y-2">
                          {currentTransmission?.transmission_mode === 'manual_csv' ? (
                            <p>
                              👉 <strong>Action manuelle requise :</strong> Prenez le fichier CSV / Excel téléchargé et transmettez-le de façon sécurisée à votre partenaire (WhatsApp, email crypté). Une fois transmis, cliquez sur le bouton ci-dessous pour archiver.
                            </p>
                          ) : (
                            <p>
                              👉 <strong>Email direct :</strong> L'envoi automatique d'email direct a été sollicité. Veuillez marquer comme envoyé pour confirmer la bonne exécution et l'enregistrement de l'audit.
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleMarkAsSent}
                            className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs px-4 hover:bg-emerald-700 transition-all shadow-sm active:scale-[0.99]"
                          >
                            <CheckCircle size={14} />
                            Marquer comme envoyé
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              // Annuler et retourner à l'étape 2 (réinitialiser partner_id)
                              try {
                                const { error } = await (supabase as any)
                                  .from("leads")
                                  .update({ partner_id: null, partner_status: "unassigned" })
                                  .eq("id", lead.id);
                                
                                if (error) throw error;
                                
                                // Delete the prepared transmission record
                                if (currentTransmission?.id) {
                                  await (supabase as any)
                                    .from("partner_transmissions")
                                    .delete()
                                    .eq("id", currentTransmission.id);
                                }

                                await loadLeadData();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-650 font-bold text-xs px-4 transition-all"
                          >
                            Réaffecter
                          </button>
                        </div>
                      </div>
                    )}

                    {activeStep === 5 && (
                      <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-4 shadow-sm">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-emerald-650" />
                            Étape 5 : Transmission finalisée
                          </h5>
                          <p className="text-[11px] text-zinc-500">
                            Dossier transmis au cabinet <strong>{currentTransmission?.partners?.name}</strong>.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs font-semibold bg-emerald-50/20 border-emerald-100 text-emerald-800">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              currentTransmission?.status === "acknowledged" ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                            }`}></span>
                            <span>
                              {currentTransmission?.status === "acknowledged" 
                                ? "Dossier bien reçu par le partenaire (Accusé validé)" 
                                : "En attente de l'accusé de réception du partenaire"
                              }
                            </span>
                          </div>

                          {currentTransmission?.status !== "acknowledged" && (
                            <button
                              type="button"
                              onClick={handleForceAcknowledge}
                              className="inline-flex h-7 items-center justify-center bg-white border border-emerald-250 hover:bg-emerald-50 text-emerald-850 font-bold text-[10px] px-2.5 rounded shadow-sm transition-all"
                            >
                              Forcer l'accusé
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            // Réinitialiser pour pouvoir re-transmettre
                            if (confirm("Voulez-vous réinitialiser et re-transmettre ce dossier ?")) {
                              try {
                                await (supabase as any)
                                  .from("leads")
                                  .update({ partner_id: null, partner_status: "unassigned" })
                                  .eq("id", lead.id);
                                await loadLeadData();
                              } catch (e) {
                                console.error(e);
                              }
                            }
                          }}
                          className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-650 font-bold text-xs px-4 transition-all shadow-sm active:scale-[0.99]"
                        >
                          Re-transmettre / Réaffecter
                        </button>
                      </div>
                    )}

                  </div>
                )}              </div>
            )}
          </div>

        </div>

        {/* Right Side: Timeline / Event logging */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Form: Log manual Note */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
              Enregistrer une action
            </h3>
            
            <form onSubmit={handleAddManualNote} className="space-y-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ex: Appel effectué. Le candidat confirme son projet de carte de résident de 10 ans."
                rows={3}
                required
                className="w-full p-3 text-sm border border-zinc-250 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-zinc-50/20"
              />
              
              <button
                type="submit"
                disabled={submittingNote || !noteContent.trim()}
                className="w-full h-10 rounded-lg bg-zinc-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-850 active:scale-95 transition-all disabled:opacity-50"
              >
                {submittingNote ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Ajouter la note
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Timeline of events */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-zinc-850 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Clock size={16} className="text-zinc-500" />
              Historique de traitement
            </h3>

            {events.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-4">Aucun événement enregistré.</p>
            ) : (
              <div className="relative pl-6 border-l border-zinc-200 space-y-6">
                {events.map((ev) => {
                  return (
                    <div key={ev.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1 h-4.5 w-4.5 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-650"></span>
                      </span>

                      <div className="flex justify-between items-start gap-4">
                        <p className="text-xs font-bold text-zinc-800">
                          {ev.event_name === "status_updated" && "Statut mis à jour"}
                          {ev.event_name === "lead_exporte_csv" && "Lead exporté XLSX"}
                          {ev.event_name === "manual_note" && "Note enregistrée"}
                          {ev.event_name === "lead_captured" && "Qualification capturée"}
                          {ev.event_name === "lead_transmis_partenaire" && "Transmis au partenaire"}
                          {ev.event_name !== "status_updated" && ev.event_name !== "lead_exporte_csv" && ev.event_name !== "manual_note" && ev.event_name !== "lead_captured" && ev.event_name !== "lead_transmis_partenaire" && ev.event_name}
                        </p>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                          {ev.created_at ? new Date(ev.created_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </span>
                      </div>

                      {/* Display event details if relevant */}
                      {ev.event_name === "manual_note" && ev.properties?.content && (
                        <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 leading-relaxed">
                          {ev.properties.content}
                        </p>
                      )}
                      
                      {ev.event_name === "status_updated" && ev.properties?.status && (
                        <p className="text-[11px] text-zinc-500">
                          Nouveau statut : <span className="font-bold text-zinc-800">{ev.properties.status}</span>
                        </p>
                      )}

                      {ev.event_name === "lead_exporte_csv" && ev.properties?.exported_at && (
                        <p className="text-[11px] text-zinc-500">
                          Exporté le {new Date(ev.properties.exported_at).toLocaleString("fr-FR")}
                        </p>
                      )}

                      {ev.event_name === "lead_transmis_partenaire" && ev.properties?.partner_name && (
                        <p className="text-[11px] text-zinc-500 leading-normal bg-indigo-50/30 border border-indigo-100 p-2 rounded-lg">
                          Partenaire : <span className="font-bold text-zinc-800">{ev.properties.partner_name}</span> ({ev.properties.mode === "manual_csv" ? "CSV" : ev.properties.mode === "manual_pdf" ? "PDF" : ev.properties.mode})
                          {ev.properties.notes && <span className="block mt-1 italic text-zinc-600">"{ev.properties.notes}"</span>}
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

      {/* Proof/Snapshot viewer modal */}
      {showSnapshotsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-zinc-900">Preuves RGPD - Instantané Figé</h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">ID Transmission: {showSnapshotsModal.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSnapshotsModal(null)}
                className="h-8 w-8 rounded-lg bg-zinc-150 hover:bg-zinc-250 text-zinc-600 hover:text-zinc-900 flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </header>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Snapshot Payload info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Données transmises (Payload Snapshot)</h4>
                <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl space-y-2 text-xs font-mono">
                  <div><strong className="text-zinc-500">Prénom:</strong> {showSnapshotsModal.payload_snapshot?.first_name}</div>
                  <div><strong className="text-zinc-500">Nom:</strong> {showSnapshotsModal.payload_snapshot?.last_name || "-"}</div>
                  <div><strong className="text-zinc-500">Email:</strong> {showSnapshotsModal.payload_snapshot?.email || "-"}</div>
                  <div><strong className="text-zinc-500">WhatsApp:</strong> {showSnapshotsModal.payload_snapshot?.whatsapp_phone || "-"}</div>
                  <div><strong className="text-zinc-500">Niveau:</strong> {showSnapshotsModal.payload_snapshot?.estimated_level || "-"}</div>
                  <div><strong className="text-zinc-500">Démarche:</strong> {showSnapshotsModal.payload_snapshot?.partner_request_type || "-"}</div>
                  {showSnapshotsModal.payload_snapshot?.message && (
                    <div className="border-t border-zinc-200/50 pt-2 mt-2">
                      <strong className="text-zinc-500 block mb-1">Message:</strong>
                      <span className="text-zinc-700 italic">"{showSnapshotsModal.payload_snapshot.message}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Consent Snapshots info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preuves de consentements associées</h4>
                <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl space-y-2 text-xs font-mono">
                  <div>
                    <strong className="text-zinc-500">Opt-in Partenaire:</strong>{" "}
                    <span className="text-emerald-700 font-bold">
                      {showSnapshotsModal.consent_snapshot?.consent_partner ? "OUI (TRUE)" : "NON"}
                    </span>
                  </div>
                  <div>
                    <strong className="text-zinc-500">Version du texte:</strong>{" "}
                    {showSnapshotsModal.consent_snapshot?.consent_partner_text_version || "v1.0"}
                  </div>
                  <div>
                    <strong className="text-zinc-500">Horodatage d'origine:</strong>{" "}
                    {showSnapshotsModal.consent_snapshot?.consent_timestamp
                      ? new Date(showSnapshotsModal.consent_snapshot.consent_timestamp).toLocaleString("fr-FR")
                      : "-"}
                  </div>
                  <div className="border-t border-zinc-200/50 pt-2 mt-2">
                    <strong className="text-zinc-500">Figeage légal de la transmission:</strong>{" "}
                    {showSnapshotsModal.transmitted_at
                      ? new Date(showSnapshotsModal.transmitted_at).toLocaleString("fr-FR")
                      : "-"}
                  </div>
                </div>
              </div>

            </div>

            <footer className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSnapshotsModal(null)}
                className="h-10 px-5 rounded-lg border border-zinc-250 bg-white font-bold text-xs text-zinc-700 hover:bg-zinc-50 transition-all"
              >
                Fermer
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
}
