import { supabase } from "../integrations/supabase/client";

export interface TransmissionParams {
  lead_id: string;
  partner_id: string;
  transmitted_by: string; // user_id de l'admin
  mode: "manual_csv" | "manual_pdf" | "email";
  notes?: string;
}

export async function preparerTransmission(params: TransmissionParams): Promise<void> {
  // 1. Fetch Lead
  const { data: lead, error: leadError } = await (supabase as any)
    .from("leads")
    .select("*")
    .eq("id", params.lead_id)
    .single();

  if (leadError) throw new Error(`Impossible de récupérer le prospect : ${leadError.message}`);
  if (!lead) throw new Error("Prospect introuvable.");

  // 2. Fetch Partner
  const { data: partner, error: partnerError } = await (supabase as any)
    .from("partners")
    .select("*")
    .eq("id", params.partner_id)
    .single();

  if (partnerError) throw new Error(`Impossible de récupérer le partenaire : ${partnerError.message}`);
  if (!partner) throw new Error("Partenaire introuvable.");

  // 3. Business rule checks
  if (!lead.consent_partner) {
    throw new Error("Transmission impossible : consentement partenaire absent");
  }
  if (partner.status !== "active") {
    throw new Error("Transmission impossible : partenaire non actif");
  }

  // 4. Create transmission record in Supabase
  const snapshotAt = new Date().toISOString();
  
  const transmissionData = {
    lead_id: params.lead_id,
    partner_id: params.partner_id,
    transmission_mode: params.mode,
    transmitted_by: params.transmitted_by,
    payload_snapshot: {
      first_name: lead.first_name,
      last_name: lead.last_name || null,
      email: lead.email || null,
      whatsapp_phone: lead.whatsapp_phone || null,
      estimated_level: lead.estimated_level || null,
      partner_request_type: lead.partner_request_type || null,
      message: lead.message || null,
      snapshot_at: snapshotAt
    },
    consent_snapshot: {
      consent_partner: lead.consent_partner,
      consent_partner_text_version: lead.consent_partner_text_version || "v1.0",
      consent_timestamp: lead.consent_timestamp || null,
      snapshot_at: snapshotAt
    },
    status: "prepared",
    transmitted_at: snapshotAt,
    notes: params.notes || null
  };

  const { error: insertError } = await (supabase as any)
    .from("partner_transmissions")
    .insert(transmissionData);

  if (insertError) throw new Error(`Erreur lors de l'enregistrement de la transmission : ${insertError.message}`);

  // 5. Update lead fields
  const { error: updateError } = await (supabase as any)
    .from("leads")
    .update({
      partner_id: params.partner_id,
      partner_status: "assigned",
      status: "exported"
    })
    .eq("id", params.lead_id);

  if (updateError) throw new Error(`Erreur lors de la mise à jour du prospect : ${updateError.message}`);

  // 6. Log event in history timeline for auditability
  const { error: eventError } = await (supabase as any)
    .from("lead_events")
    .insert({
      lead_id: params.lead_id,
      event_name: "lead_transmis_partenaire",
      properties: { 
        partner_id: params.partner_id, 
        partner_name: partner.name, 
        mode: params.mode,
        notes: params.notes || ""
      }
    });

  if (eventError) {
    console.error("[preparerTransmission] Minor error, failed to insert audit timeline event:", eventError);
  }
}
