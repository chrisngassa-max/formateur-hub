// Événements Plausible à implémenter

type PlausibleEvent =
  | "test_started"
  | "test_completed"
  | "result_viewed"
  | "lead_capture_submitted"
  | "lead_capture_succeeded"
  | "lead_capture_failed"
  | "partner_interest_checked"
  | "partner_page_viewed"
  | "partner_lead_submitted"
  | "partner_lead_succeeded"
  | "partner_lead_failed"
  | "whatsapp_clicked"
  | "cpf_link_clicked"
  | "export_downloaded"

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

export function track(event: PlausibleEvent, props?: Record<string, string>) {
  if (typeof window === "undefined") return;
  
  if (typeof window.plausible === "function") {
    window.plausible(event, props ? { props } : undefined);
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[Plausible DEV Tracking]", event, props ?? {});
  }
}
