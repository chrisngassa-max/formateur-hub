// Edge function: analyse IA via Anthropic Claude
// Sécurisé : la clé reste côté serveur. Auth requise.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-5-20250929";

function buildPrompt({ candidate, projection, localQuestion }: any) {
  return {
    system: [
      "Tu es un assistant de préqualification de dossiers de financement formation en France.",
      "Tu aides une secrétaire à saisir le minimum utile pour améliorer une projection.",
      "Tu ne promets jamais un financement.",
      "Tu réponds uniquement en JSON strict, sans Markdown.",
      "Si une information manque ou n'est pas sûre, mets confidence à faible et indique À confirmer.",
    ].join(" "),
    user: JSON.stringify({
      task: "Analyse ce dossier et propose la prochaine question utile, les risques et une synthèse courte.",
      expected_schema: {
        summary: "string",
        confidence: "forte | moyenne | faible",
        probable_aids: ["string"],
        next_questions: [
          { question: "string", field: "keyof Candidate or empty string", priority: "haute | moyenne | basse", reason: "string", target: "secretaire | candidat | employeur | conseiller | financeur" },
        ],
        missing_documents: [{ name: "string", required_for: "string", status: "present | manquant | a_verifier" }],
        risk_flags: ["string"],
        projection_comment: "string",
      },
      candidate,
      projection,
      local_next_question: localQuestion,
      legal_constraint: "Projection indicative. Ne constitue pas une décision officielle de financement.",
    }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, mode: "local_fallback", error: "ANTHROPIC_API_KEY non configurée." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = await req.json();
    const prompt = buildPrompt(payload);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      }),
    });

    if (!r.ok) {
      const errorText = await r.text();
      return new Response(
        JSON.stringify({ ok: false, mode: "local_fallback", error: `Anthropic ${r.status}: ${errorText}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await r.json();
    const text = data?.content?.[0]?.text ?? "{}";
    try {
      const result = JSON.parse(text);
      return new Response(JSON.stringify({ ok: true, mode: "anthropic", result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ ok: false, mode: "local_fallback", error: "Réponse IA non JSON.", raw: text }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, mode: "local_fallback", error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
