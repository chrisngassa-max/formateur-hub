import ExcelJS from "exceljs";
import { supabase } from "../integrations/supabase/client";
import { track } from "./tracking-plausible";

export interface LeadForExport {
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
  consent_training: boolean;
  consent_partner: boolean;
  consent_training_text_version?: string | null;
  consent_timestamp?: string | null;
  status?: string | null;
  partner_status?: string | null;
}

export async function exportLeadsXLSX(leads: LeadForExport[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Leads");

  sheet.columns = [
    { header: "ID",               key: "id",                    width: 38 },
    { header: "Date",             key: "created_at",             width: 20 },
    { header: "Prénom",           key: "first_name",             width: 15 },
    { header: "Nom",              key: "last_name",              width: 15 },
    { header: "Email",            key: "email",                  width: 30 },
    { header: "WhatsApp",         key: "whatsapp_phone",         width: 18 },
    { header: "Type",             key: "lead_type",              width: 15 },
    { header: "Source",           key: "source",                 width: 20 },
    { header: "Niveau estimé",    key: "estimated_level",        width: 12 },
    { header: "Démarche",         key: "partner_request_type",   width: 20 },
    { header: "Consentement formation", key: "consent_training", width: 10 },
    { header: "Consentement partenaire", key: "consent_partner", width: 10 },
    { header: "Version consentement",   key: "consent_training_text_version", width: 10 },
    { header: "Horodatage consentement", key: "consent_timestamp", width: 20 },
    { header: "Statut",           key: "status",                 width: 15 },
    { header: "Partenaire statut", key: "partner_status",        width: 20 },
  ];

  for (const lead of leads) {
    sheet.addRow({
      ...lead,
      consent_training: lead.consent_training ? "Oui" : "Non",
      consent_partner: lead.consent_partner ? "Oui" : "Non",
      created_at: lead.created_at ? new Date(lead.created_at).toLocaleString("fr-FR") : "",
      consent_timestamp: lead.consent_timestamp ? new Date(lead.consent_timestamp).toLocaleString("fr-FR") : "",
    });
  }

  // Style en-têtes
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" }
  };

  // Generate and Download file in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  track("export_downloaded");

  // Traçabilité : log events & update status
  try {
    const exportedAt = new Date().toISOString();
    
    // 1. Log export events
    const eventRows = leads.map(l => ({
      lead_id: l.id,
      event_name: "lead_exporte_csv",
      properties: { exported_at: exportedAt }
    }));

    if (eventRows.length > 0) {
      await (supabase as any).from("lead_events").insert(eventRows);
    }

    // 2. Update lead status to 'exported'
    const leadIds = leads.map(l => l.id);
    if (leadIds.length > 0) {
      await (supabase as any)
        .from("leads")
        .update({ status: "exported" })
        .in("id", leadIds);
    }
  } catch (err) {
    console.error("[exportLeadsXLSX] Failed to log events or update status in Supabase:", err);
  }
}

export function exportPartnerLeadsCSV(leads: any[], partnerSlug: string): void {
  const headers = ["ID Prospect", "Date Inscription", "Prenom", "Nom", "Email", "WhatsApp", "Niveau estime", "Demarche visee", "Opt-in Partenaire", "Version Opt-in", "Horodatage Opt-in"];
  const rows = leads.map(l => [
    l.id,
    l.created_at ? new Date(l.created_at).toISOString() : "",
    l.first_name,
    l.last_name || "",
    l.email || "",
    l.whatsapp_phone || "",
    l.estimated_level || "",
    l.partner_request_type || "",
    l.consent_partner ? "TRUE" : "FALSE",
    l.consent_partner_text_version || "v1.0",
    l.consent_timestamp ? new Date(l.consent_timestamp).toISOString() : ""
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lead_export_${partnerSlug}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  track("export_downloaded");
}
