import { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth";
import { exportLeadsXLSX, exportPartnerLeadsCSV, LeadForExport } from "../../utils/export-leads";
import { preparerTransmission } from "../../utils/transmission-partenaire";
import { 
  Search, 
  Download, 
  Trash2, 
  CheckCircle, 
  Users, 
  Eye, 
  TrendingUp, 
  RefreshCw, 
  ShieldCheck, 
  Filter, 
  Mail, 
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Handshake,
  ShieldAlert
} from "lucide-react";

export function LeadsList() {
  const { isGestionnaire } = useAuth();
  const [leads, setLeads] = useState<LeadForExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState("tous");
  const [filterType, setFilterType] = useState("tous");
  const [filterStatus, setFilterStatus] = useState("tous");
  const [filterLevel, setFilterLevel] = useState("tous");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Partner Transmission
  const [activePartners, setActivePartners] = useState<any[]>([]);
  const [showTransmitModal, setShowTransmitModal] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [transMode, setTransMode] = useState<"manual_csv" | "manual_pdf" | "email">("manual_csv");
  const [transNotes, setTransNotes] = useState("");
  const [transmitting, setTransmitting] = useState(false);

  if (!isGestionnaire) return <Navigate to="/" replace />;

  async function loadLeads() {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      // Fetch active partners
      try {
        const { data: partnersData } = await (supabase as any)
          .from("partners")
          .select("*")
          .eq("status", "active");

        if (partnersData) {
          setActivePartners(partnersData);
          if (partnersData.length > 0) {
            setSelectedPartnerId(partnersData[0].id);
          }
        }
      } catch (pErr) {
        console.warn("[LeadsList] Failed to load active partners:", pErr);
      }
    } catch (err) {
      console.error("[LeadsList] Error fetching leads:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeads();
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.first_name.toLowerCase().includes(q) ||
          l.last_name?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.whatsapp_phone?.includes(q)
      );
    }

    if (filterSource !== "tous") {
      result = result.filter((l) => l.source === filterSource);
    }

    if (filterType !== "tous") {
      result = result.filter((l) => l.lead_type === filterType);
    }

    if (filterStatus !== "tous") {
      result = result.filter((l) => l.status === filterStatus);
    }

    if (filterLevel !== "tous") {
      result = result.filter((l) => l.estimated_level === filterLevel);
    }

    return result;
  }, [leads, searchQuery, filterSource, filterType, filterStatus, filterLevel]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLeads, currentPage]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((l) => l.status === "new" || !l.status).length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      exported: leads.filter((l) => l.status === "exported").length,
      adminSupport: leads.filter((l) => l.lead_type === "admin_support").length,
    };
  }, [leads]);

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedLeads.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkExport = async () => {
    const leadsToExport = leads.filter((l) => selectedIds.has(l.id));
    if (leadsToExport.length === 0) return;
    await exportLeadsXLSX(leadsToExport);
    setSelectedIds(new Set());
    loadLeads();
  };

  const handleExportAll = async () => {
    if (filteredLeads.length === 0) return;
    await exportLeadsXLSX(filteredLeads);
    loadLeads();
  };

  const handleBulkTransmitConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || selectedIds.size === 0) return;

    const eligibleLeads = leads.filter(
      (l) => selectedIds.has(l.id) && l.consent_partner && l.partner_status === "partner_requested_but_unassigned"
    );

    if (eligibleLeads.length === 0) {
      alert("Aucun prospect sélectionné n'est éligible pour la transmission (le consentement partenaire est manquant ou le dossier est déjà affecté).");
      setShowTransmitModal(false);
      return;
    }

    setTransmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Utilisateur authentifié introuvable.");

      const partner = activePartners.find((p) => p.id === selectedPartnerId);
      const partnerSlug = partner?.slug || "partner";

      for (const lead of eligibleLeads) {
        await preparerTransmission({
          lead_id: lead.id,
          partner_id: selectedPartnerId,
          transmitted_by: currentUser.id,
          mode: transMode,
          notes: transNotes.trim()
        });
      }

      exportPartnerLeadsCSV(eligibleLeads, partnerSlug);

      setShowTransmitModal(false);
      setSelectedIds(new Set());
      setTransNotes("");
      
      await loadLeads();
      alert(`La transmission de ${eligibleLeads.length} prospect(s) a été effectuée avec succès ! Le fichier d'export partenaire a été généré.`);
    } catch (err: any) {
      console.error("[LeadsList] Error during bulk transmission:", err);
      alert(err.message || "Échec de la transmission de groupe.");
    } finally {
      setTransmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from("leads")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Log event
      await (supabase as any).from("lead_events").insert({
        lead_id: id,
        event_name: "status_updated",
        properties: { status: newStatus }
      });

      // Update local state
      setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    } catch (err) {
      console.error("[LeadsList] Error updating status:", err);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Voulez-vous vraiment archiver ce lead ?")) return;
    await handleUpdateStatus(id, "archived");
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Gestion des Prospects
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Leads & Contacts
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Suivi centralisé des demandes d'évaluation de français et d'accompagnement administratif.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition-all"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
          
          <button
            onClick={handleExportAll}
            disabled={filteredLeads.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            <Download size={16} />
            Tout exporter ({filteredLeads.length})
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Total Leads</span>
          <div className="flex justify-between items-center mt-3">
            <strong className="text-3xl font-bold text-zinc-900">{stats.total}</strong>
            <Users className="text-indigo-500 h-6 w-6 shrink-0" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Nouveaux</span>
          <div className="flex justify-between items-center mt-3">
            <strong className="text-3xl font-bold text-blue-600">{stats.new}</strong>
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">Non traités</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Qualifiés</span>
          <div className="flex justify-between items-center mt-3">
            <strong className="text-3xl font-bold text-emerald-600">{stats.qualified}</strong>
            <CheckCircle className="text-emerald-500 h-6 w-6 shrink-0" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Exportés</span>
          <div className="flex justify-between items-center mt-3">
            <strong className="text-3xl font-bold text-amber-600">{stats.exported}</strong>
            <TrendingUp className="text-amber-500 h-6 w-6 shrink-0" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-purple-500"></div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Accompagnement Admin</span>
          <div className="flex justify-between items-center mt-3">
            <strong className="text-3xl font-bold text-purple-600">{stats.adminSupport}</strong>
            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">Partenaire</span>
          </div>
        </div>
      </section>

      {/* Filters bar */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-zinc-800 text-sm">
            <Filter size={16} />
            Filtres avancés
          </div>
          {(searchQuery || filterSource !== "tous" || filterType !== "tous" || filterStatus !== "tous" || filterLevel !== "tous") && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setFilterSource("tous");
                setFilterType("tous");
                setFilterStatus("tous");
                setFilterLevel("tous");
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher nom, email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 w-full h-10 border border-zinc-200 rounded-lg text-sm bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Source filter */}
          <div>
            <select
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 border border-zinc-200 rounded-lg text-sm bg-zinc-50/50 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="tous">Toutes les sources</option>
              <option value="bilan_post_result">Test Français (Bilan)</option>
              <option value="accompagnement_admin">Accompagnement Admin</option>
            </select>
          </div>

          {/* Type filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 border border-zinc-200 rounded-lg text-sm bg-zinc-50/50 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="tous">Tous les types</option>
              <option value="training">Formation uniquement</option>
              <option value="combined">Formation & Partenaire</option>
              <option value="admin_support">Partenaire uniquement</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 border border-zinc-200 rounded-lg text-sm bg-zinc-50/50 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="new">Nouveaux</option>
              <option value="contacted">Contactés</option>
              <option value="qualified">Qualifiés</option>
              <option value="exported">Exportés</option>
              <option value="archived">Archivés</option>
            </select>
          </div>

          {/* Level filter */}
          <div>
            <select
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 border border-zinc-200 rounded-lg text-sm bg-zinc-50/50 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="tous">Tous les niveaux</option>
              <option value="A1">Niveau A1</option>
              <option value="A2">Niveau A2</option>
              <option value="B1">Niveau B1</option>
              <option value="B2">Niveau B2</option>
            </select>
          </div>

        </div>
      </section>

      {/* Bulk actions bar if items are selected */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm text-indigo-800 font-medium">
            <strong>{selectedIds.size}</strong> prospect(s) sélectionné(s)
          </span>
          <div className="flex gap-3">
            {activePartners.length > 0 && (
              <button
                onClick={() => setShowTransmitModal(true)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 text-xs font-bold shadow-sm hover:bg-indigo-100"
              >
                <Handshake size={14} />
                Transmettre aux partenaires
              </button>
            )}
            
            <button
              onClick={handleBulkExport}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <Download size={14} />
              Exporter la sélection (.xlsx)
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-250 bg-white px-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table section */}
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 animate-pulse font-medium">Chargement des prospects...</div>
        ) : paginatedLeads.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <Users className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
            <h3 className="text-lg font-bold text-zinc-700 mb-1">Aucun prospect trouvé</h3>
            <p className="text-sm text-zinc-400">Aucun résultat ne correspond aux filtres actuels.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedIds.size === paginatedLeads.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="p-4">Candidat</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Niveau / Démarche</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Créé le</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-sm text-zinc-700">
                {paginatedLeads.map((l) => {
                  const isSelected = selectedIds.has(l.id);
                  return (
                    <tr 
                      key={l.id} 
                      className={`hover:bg-zinc-50/50 transition-colors ${
                        isSelected ? "bg-indigo-50/20" : ""
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(l.id, e.target.checked)}
                        />
                      </td>
                      
                      <td className="p-4 font-semibold text-zinc-900">
                        {l.first_name} {l.last_name || ""}
                      </td>
                      
                      <td className="p-4 space-y-0.5 text-xs text-zinc-500">
                        {l.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={12} className="text-zinc-400" />
                            <span>{l.email}</span>
                          </div>
                        )}
                        {l.whatsapp_phone && (
                          <div className="flex items-center gap-1.5">
                            <Smartphone size={12} className="text-zinc-400" />
                            <span>{l.whatsapp_phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {l.source === "bilan_post_result" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-250">
                            Diagnostic
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-250">
                            Accompagnement
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="text-xs font-semibold">
                          {l.lead_type === "training" && "Formation"}
                          {l.lead_type === "combined" && "Formation + Admin"}
                          {l.lead_type === "admin_support" && "Accompagnement Admin"}
                        </span>
                      </td>

                      <td className="p-4 text-xs">
                        {l.estimated_level && (
                          <div className="font-bold text-indigo-600">Niveau {l.estimated_level}</div>
                        )}
                        {l.partner_request_type && (
                          <div className="text-zinc-500 mt-0.5 italic">
                            {l.partner_request_type === "carte_sejour" && "Séjour pluriannuel"}
                            {l.partner_request_type === "resident" && "Résident / 10 ans"}
                            {l.partner_request_type === "naturalisation" && "Naturalisation"}
                            {l.partner_request_type === "je_ne_sais_pas" && "Indéterminé"}
                            {l.partner_request_type === "autre" && "Autre"}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          l.status === "new" || !l.status ? "bg-blue-100 text-blue-800" :
                          l.status === "contacted" ? "bg-amber-100 text-amber-800" :
                          l.status === "qualified" ? "bg-emerald-100 text-emerald-800" :
                          l.status === "exported" ? "bg-zinc-100 text-zinc-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {l.status === "new" || !l.status ? "Nouveau" :
                           l.status === "contacted" ? "Contacté" :
                           l.status === "qualified" ? "Qualifié" :
                           l.status === "exported" ? "Exporté" :
                           l.status === "archived" ? "Archivé" : l.status}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-zinc-400">
                        {l.created_at ? new Date(l.created_at).toLocaleDateString("fr-FR") : "-"}
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex gap-2">
                          <Link 
                            to={`/admin/leads/${l.id}`} 
                            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Consulter le détail"
                          >
                            <Eye size={16} />
                          </Link>
                          
                          {l.status !== "qualified" && (
                            <button
                              onClick={() => handleUpdateStatus(l.id, "qualified")}
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Marquer qualifié"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => handleArchive(l.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Archiver"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 bg-zinc-50 border-t border-zinc-200">
            <span className="text-xs font-semibold text-zinc-500">
              Page {currentPage} sur {totalPages} ({filteredLeads.length} prospects)
            </span>
            <div className="inline-flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal: Bulk Transmission */}
      {showTransmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Handshake size={20} className="text-indigo-600" />
                <h3 className="font-extrabold text-zinc-900">Transmission par Lot Auditable</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransmitModal(false)}
                className="h-8 w-8 rounded-lg bg-zinc-150 hover:bg-zinc-200 text-zinc-650 flex items-center justify-center text-xs font-bold transition-all"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleBulkTransmitConfirm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Notice on consent & count */}
                <div className="bg-indigo-50/70 border border-indigo-150 p-4 rounded-xl space-y-1.5 shadow-sm text-xs text-indigo-900 leading-relaxed font-medium">
                  <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                    <ShieldAlert size={14} className="text-indigo-600" />
                    Figeage Légal de Consentement (RGPD)
                  </p>
                  <p>
                    Seuls les prospects ayant explicitement coché la case de consentement pour cabinet partenaire et non encore assignés seront transmis.
                  </p>
                  <p className="mt-1 font-bold text-zinc-700">
                    Nombre total sélectionnés : {selectedIds.size}
                  </p>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Partenaire Destinataire *</label>
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      required
                      className="w-full h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {activePartners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Mode de Transmission *</label>
                    <select
                      value={transMode}
                      onChange={(e) => setTransMode(e.target.value as any)}
                      required
                      className="w-full h-10 px-3 border border-zinc-250 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="manual_csv">Export CSV / Excel</option>
                      <option value="manual_pdf">Fiche PDF</option>
                      <option value="email">Email Direct</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Notes / Consignes complémentaires</label>
                    <textarea
                      placeholder="Ex: Dossiers urgents préfecture..."
                      rows={3}
                      value={transNotes}
                      onChange={(e) => setTransNotes(e.target.value)}
                      className="w-full p-3 border border-zinc-250 rounded-lg text-xs bg-zinc-50/20 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

              </div>

              <footer className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTransmitModal(false)}
                  className="h-10 px-4 rounded-lg border border-zinc-250 bg-white font-bold text-xs text-zinc-700 hover:bg-zinc-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={transmitting || !selectedPartnerId}
                  className="h-10 px-5 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-750 transition-all shadow disabled:opacity-50"
                >
                  {transmitting ? (
                    <>
                      <span className="inline-block animate-spin mr-1">⚡</span>
                      Transmission...
                    </>
                  ) : (
                    <>
                      <Handshake size={14} />
                      Confirmer et Exporter (.csv)
                    </>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
