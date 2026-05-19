import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth";
import { 
  Handshake, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw
} from "lucide-react";

interface Lead {
  id: string;
  first_name: string;
  partner_request_type?: string | null;
  status: string;
  partner_status?: string | null;
  appointment_date?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export function PartnerDashboard() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState("tous");
  const [demarcheFilter, setDemarcheFilter] = useState("tous");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadPartnerAndLeads() {
    if (!user?.email) return;
    
    try {
      // 1. Fetch partner by contact_email
      const { data: partnerData, error: partnerError } = await (supabase as any)
        .from("partners")
        .select("*")
        .eq("contact_email", user.email)
        .maybeSingle();

      if (partnerError) throw partnerError;

      if (!partnerData) {
        setPartner(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setPartner(partnerData);

      // 2. Fetch leads assigned to this partner
      const { data: leadsData, error: leadsError } = await (supabase as any)
        .from("leads")
        .select("id, first_name, partner_request_type, status, partner_status, appointment_date, created_at, updated_at")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

    } catch (err) {
      console.error("[PartnerDashboard] Error loading dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPartnerAndLeads();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPartnerAndLeads();
  };

  // Urgency tag generator helper
  const getUrgency = (appointmentDateStr?: string | null) => {
    if (!appointmentDateStr) return { label: "Pas de RDV", color: "bg-zinc-100 text-zinc-650 border-zinc-200" };

    const appointmentDate = new Date(appointmentDateStr);
    const today = new Date();
    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Passé", color: "bg-zinc-100 text-zinc-550 border-zinc-200" };
    }
    if (diffDays <= 14) {
      return { label: `J-${diffDays} (Imminent)`, color: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (diffDays <= 30) {
      return { label: `J-${diffDays}`, color: "bg-amber-50 text-amber-700 border-amber-250" };
    }
    return { label: `J-${diffDays}`, color: "bg-emerald-50 text-emerald-700 border-emerald-250" };
  };

  // Stats calculation
  const stats = useMemo(() => {
    const nouveaux = leads.filter(l => l.status === "nouveau" || l.status === "exported" || !l.status).length;
    const enCours = leads.filter(l => ["en_cours", "contact_effectue", "dossier_recu", "en_attente_piece"].includes(l.status)).length;
    const traites = leads.filter(l => l.status === "traite").length;
    return { nouveaux, enCours, traites };
  }, [leads]);

  // Filtered Leads list
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => l.first_name.toLowerCase().includes(q));
    }

    if (statusFilter !== "tous") {
      if (statusFilter === "nouveau") {
        result = result.filter(l => l.status === "nouveau" || l.status === "exported");
      } else {
        result = result.filter(l => l.status === statusFilter);
      }
    }

    if (demarcheFilter !== "tous") {
      result = result.filter(l => l.partner_request_type === demarcheFilter);
    }

    return result;
  }, [leads, searchQuery, statusFilter, demarcheFilter]);

  const handleQuickStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      // Register the event
      await (supabase as any).from("lead_events").insert({
        lead_id: leadId,
        event_name: "status_updated",
        properties: { status: newStatus, source: "partner_dashboard" }
      });

      // Update locally
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error("[PartnerDashboard] Quick status change failed:", err);
      alert("Une erreur est survenue lors de la mise à jour.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Chargement de votre espace partenaire...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl shadow-sm max-w-2xl mx-auto mt-12">
        <AlertCircle className="mx-auto h-12 w-12 text-zinc-450 mb-3" />
        <h3 className="text-lg font-bold text-zinc-900 mb-1">Accès non configuré</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto px-4 leading-normal">
          Votre compte n'est actuellement rattaché à aucun cabinet partenaire actif. 
          Veuillez contacter l'administrateur de Formateur Hub pour configurer votre adresse email **({user?.email})** dans la console d'administration.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header section */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
            <Handshake size={14} /> Espace Partenaire
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900">
            Bonjour, {partner.name}
          </h2>
          <p className="text-sm text-zinc-500">
            Gérez en toute sécurité les dossiers administratifs qui vous sont délégués.
          </p>
        </div>

        <div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-sm px-4 shadow-sm transition-all"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Nouveaux dossiers</span>
            <span className="text-2xl font-black text-zinc-900">{stats.nouveaux}</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <SlidersHorizontal size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">En cours de traitement</span>
            <span className="text-2xl font-black text-zinc-900">{stats.enCours}</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Dossiers traités</span>
            <span className="text-2xl font-black text-zinc-900">{stats.traites}</span>
          </div>
        </div>
      </div>

      {/* Filter and Table card */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
        
        {/* Filters bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center border-b border-zinc-100 pb-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase block">Rechercher</label>
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Prénom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 border border-zinc-250 rounded-lg text-xs bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-455 uppercase block">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 border border-zinc-250 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="tous">Tous les statuts</option>
                <option value="nouveau">Nouveaux dossiers</option>
                <option value="en_cours">En cours</option>
                <option value="contact_effectue">Contact effectué</option>
                <option value="dossier_recu">Dossier reçu</option>
                <option value="en_attente_piece">En attente de pièces</option>
                <option value="traite">Traité</option>
                <option value="sans_suite">Sans suite</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-455 uppercase block">Démarche</label>
              <select
                value={demarcheFilter}
                onChange={(e) => setDemarcheFilter(e.target.value)}
                className="h-9 px-3 border border-zinc-250 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="tous">Toutes les démarches</option>
                <option value="carte_sejour">Carte de séjour</option>
                <option value="resident">Carte de résident</option>
                <option value="naturalisation">Naturalisation</option>
                <option value="autre">Autre démarche</option>
              </select>
            </div>

          </div>

          <div className="text-[11px] font-bold text-zinc-450 self-end lg:self-auto bg-zinc-50 border border-zinc-150 px-3 py-1.5 rounded-lg">
            {filteredLeads.length} dossiers affichés
          </div>
        </div>

        {/* Table representation */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="mx-auto h-10 w-10 text-zinc-350 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">Aucun dossier trouvé</p>
            <p className="text-xs text-zinc-400 mt-0.5">Modifiez vos filtres de recherche ou attendez de nouvelles attributions.</p>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-500">
                  <th className="p-4">Candidat (Prénom)</th>
                  <th className="p-4">Démarche sollicitée</th>
                  <th className="p-4">Urgence RDV</th>
                  <th className="p-4">Statut traitement</th>
                  <th className="p-4">Dernière mise à jour</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredLeads.map((lead) => {
                  const urgency = getUrgency(lead.appointment_date);
                  return (
                    <tr key={lead.id} className="hover:bg-zinc-50/50 transition-colors group">
                      
                      {/* Prénom */}
                      <td className="p-4 font-bold text-zinc-850 group-hover:text-zinc-950">
                        {lead.first_name}
                      </td>

                      {/* Démarche */}
                      <td className="p-4">
                        <span className="font-semibold text-zinc-650">
                          {lead.partner_request_type === "carte_sejour" && "Carte de séjour"}
                          {lead.partner_request_type === "resident" && "Carte de résident"}
                          {lead.partner_request_type === "naturalisation" && "Naturalisation"}
                          {lead.partner_request_type === "autre" && "Autre dossier"}
                          {!lead.partner_request_type && "Non spécifiée"}
                        </span>
                      </td>

                      {/* Urgence RDV */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${urgency.color}`}>
                          <Calendar size={10} />
                          {urgency.label}
                        </span>
                      </td>

                      {/* Statut avec select d'action rapide */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={lead.status || "nouveau"}
                            onChange={(e) => handleQuickStatusChange(lead.id, e.target.value)}
                            className={`h-7 px-2 border rounded-md text-[11px] font-semibold outline-none focus:ring-1 focus:ring-amber-500 ${
                              lead.status === "traite" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              lead.status === "sans_suite" ? "bg-rose-50 text-rose-800 border-rose-200" :
                              ["contact_effectue", "dossier_recu", "en_attente_piece"].includes(lead.status || "") ? "bg-indigo-50 text-indigo-800 border-indigo-200" :
                              "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value="exported">Nouveau (Transmis)</option>
                            <option value="en_cours">En cours</option>
                            <option value="contact_effectue">Contact effectué</option>
                            <option value="dossier_recu">Dossier reçu</option>
                            <option value="en_attente_piece">Pièce manquante</option>
                            <option value="traite">Traité</option>
                            <option value="sans_suite">Sans suite</option>
                          </select>
                        </div>
                      </td>

                      {/* Dernière MAJ */}
                      <td className="p-4 text-zinc-450 font-medium">
                        {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : new Date(lead.created_at).toLocaleDateString("fr-FR")}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <Link
                          to={`/partenaire/dossiers/${lead.id}`}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 bg-white font-bold text-[11px] px-3 text-zinc-650 hover:text-zinc-900 shadow-sm transition-all"
                        >
                          Ouvrir la fiche
                          <ChevronRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
