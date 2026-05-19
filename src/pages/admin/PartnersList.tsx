import { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth";
import { 
  Plus, 
  Handshake, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  FileText, 
  FileCheck, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";

interface Partner {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  status: "draft" | "active" | "inactive";
  service_types: string[];
  requires_manual_export: boolean;
  transmission_mode: "manual_csv" | "manual_pdf" | "email" | "future_api";
  legal_notes?: string | null;
  kbis_verified: boolean;
  insurance_verified: boolean;
  contract_signed: boolean;
  contract_signed_at?: string | null;
}

export function PartnersList() {
  const { isAdmin } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Security Gate
  if (!isAdmin) return <Navigate to="/" replace />;

  async function loadPartners() {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("partners")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error("[PartnersList] Error loading partners:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPartners();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPartners();
  };

  // Filter partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (p.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === "tous" || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [partners, searchQuery, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const paginatedPartners = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPartners.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPartners, currentPage]);

  // Toggle status with business rules
  const handleToggleStatus = async (partner: Partner) => {
    let nextStatus: "draft" | "active" | "inactive" = "inactive";
    
    if (partner.status !== "active") {
      // Rule check: KBIS + Signed Contract
      if (!partner.kbis_verified || !partner.contract_signed) {
        alert(
          "⚠️ Impossible d'activer ce partenaire :\n" +
          "Le KBIS doit être vérifié (kbis_verified = true) et le contrat de partenariat doit être dûment signé (contract_signed = true)."
        );
        return;
      }
      nextStatus = "active";
    } else {
      nextStatus = "inactive";
    }

    try {
      const { error } = await (supabase as any)
        .from("partners")
        .update({ status: nextStatus })
        .eq("id", partner.id);

      if (error) throw error;
      
      setPartners(partners.map(p => p.id === partner.id ? { ...p, status: nextStatus } : p));
    } catch (err) {
      console.error("[PartnersList] Error updating status:", err);
      alert("Une erreur est survenue lors de la mise à jour du statut.");
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Module Partenariats
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Cabinets Conseils & Partenaires
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Configurez les experts tiers pour la prise en charge des démarches administratives.
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
          
          <Link
            to="/admin/partenaires/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all"
          >
            <Plus size={16} />
            Ajouter un partenaire
          </Link>
        </div>
      </header>

      {/* Info Banner */}
      <section className="bg-amber-50/70 border border-amber-250 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
        <AlertCircle className="text-amber-600 h-6 w-6 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-800">Aucun partenaire actif pour le moment</h4>
          <p className="text-sm text-amber-700 leading-relaxed font-medium">
            Tous les leads récoltés avec une demande d'accompagnement administratif sont conservés de manière sécurisée et centralisée. Ils restent en attente d'assignation jusqu'à l'activation d'un partenaire qualifié et approuvé juridiquement.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher par nom de cabinet, contact, email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 w-full h-10 border border-zinc-200 rounded-lg text-sm bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 border border-zinc-200 rounded-lg text-sm bg-zinc-50/50 px-3 outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="draft">En préparation (Draft)</option>
            <option value="active">Actifs (Active)</option>
            <option value="inactive">Inactifs (Inactive)</option>
          </select>
        </div>
      </section>

      {/* Table grid */}
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 animate-pulse font-medium">Chargement des partenaires...</div>
        ) : paginatedPartners.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <Handshake className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
            <h3 className="text-lg font-bold text-zinc-700 mb-1">Aucun partenaire enregistré</h3>
            <p className="text-sm text-zinc-400">Aucun résultat ne correspond aux filtres actuels ou la base est vide.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="p-4">Cabinet Partenaire</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Mode Transmission</th>
                  <th className="p-4 text-center">KBIS</th>
                  <th className="p-4 text-center">Assurance RCP</th>
                  <th className="p-4 text-center">Contrat signé</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-sm text-zinc-700">
                {paginatedPartners.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <strong className="text-zinc-900 font-bold text-base">{p.name}</strong>
                          <span className="text-xs text-zinc-400 font-mono mt-0.5">{p.slug}</span>
                        </div>
                      </td>
                      
                      <td className="p-4 space-y-0.5 text-xs text-zinc-500">
                        <div className="font-semibold text-zinc-800">{p.contact_name || "-"}</div>
                        {p.contact_email && <div>{p.contact_email}</div>}
                        {p.contact_whatsapp && <div>{p.contact_whatsapp}</div>}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {p.transmission_mode === "manual_csv" && "CSV Manuel"}
                          {p.transmission_mode === "manual_pdf" && "PDF Manuel"}
                          {p.transmission_mode === "email" && "Email direct"}
                          {p.transmission_mode === "future_api" && "API Connecteur"}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {p.kbis_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs" title="KBIS validé">
                            <FileCheck size={16} /> Oui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-400 font-medium text-xs" title="Pièce manquante">
                            <ShieldAlert size={16} /> Non
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {p.insurance_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs" title="Assurance RCP validée">
                            <FileCheck size={16} /> Oui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-400 font-medium text-xs" title="Pièce manquante">
                            <ShieldAlert size={16} /> Non
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {p.contract_signed ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs" title="Contrat de partenariat signé">
                              <FileCheck size={16} /> Signé
                            </span>
                            {p.contract_signed_at && (
                              <span className="text-[10px] text-zinc-400 mt-0.5">
                                {new Date(p.contract_signed_at).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-400 font-medium text-xs" title="Contrat non signé">
                            <ShieldAlert size={16} /> Non
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.status === "active" ? "bg-emerald-100 text-emerald-800" :
                          p.status === "inactive" ? "bg-red-100 text-red-800" :
                          "bg-zinc-100 text-zinc-800"
                        }`}>
                          {p.status === "draft" && "En préparation"}
                          {p.status === "active" && "Actif"}
                          {p.status === "inactive" && "Inactif"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`h-8 px-3 rounded-lg text-xs font-bold transition-all border ${
                              p.status === "active" 
                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100"
                            }`}
                          >
                            {p.status === "active" ? "Désactiver" : "Activer"}
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 bg-zinc-50 border-t border-zinc-200">
            <span className="text-xs font-semibold text-zinc-500">
              Page {currentPage} sur {totalPages} ({filteredPartners.length} partenaires)
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

    </div>
  );
}
