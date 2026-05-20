import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const NIVEAUX_VALIDES = ["A1", "A2", "B1", "B1_nat", "B2", "a_verifier"]

function normaliserNiveau(v: unknown, defaut: string): string {
  if (typeof v === "string" && NIVEAUX_VALIDES.includes(v)) {
    return v
  }
  return defaut
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("CLAUDE_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY/CLAUDE_API_KEY non configurée dans le Brain." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { consigne, texte_candidat, niveau_cible } = await req.json()
    if (!consigne || !texte_candidat || !niveau_cible) {
      return new Response(
        JSON.stringify({ error: "Données manquantes (consigne, texte_candidat, niveau_cible requis)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const systemPrompt =
      "Tu es un examinateur expert FLE (Français Langue Étrangère) formé au CECRL. " +
      "Tu évalues une production écrite de manière bienveillante mais rigoureuse. " +
      "Tu ne délivres JAMAIS de certification : tu donnes un NIVEAU ESTIMÉ indicatif. " +
      "Tu réponds STRICTEMENT en JSON valide, sans texte autour, conforme au schéma demandé."

    const userPrompt = `Consigne donnée au candidat :
"""${consigne}"""

Niveau CECRL visé : ${niveau_cible}

Production écrite du candidat :
"""${texte_candidat}"""

Évalue cette production. Réponds UNIQUEMENT avec un JSON de cette forme :
{
  "score": <entier 0-100>,
  "niveau_estime": "A1"|"A2"|"B1"|"B1_nat"|"B2"|"a_verifier",
  "points_forts": [string, ...],   // 2 à 4 points concrets
  "points_ameliorer": [string, ...], // 2 à 4 points concrets et actionnables
  "commentaire": string             // 2-4 phrases, ton bienveillant, parle de "niveau estimé"
}`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(
        JSON.stringify({ error: `Erreur Anthropic (${response.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const data = await response.json()
    let raw = data.content?.[0]?.text ?? ""
    
    // Extract JSON block if surrounded by markdown code block
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) raw = match[0]
    
    const parsed = JSON.parse(raw)

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))))
    const points_forts = Array.isArray(parsed.points_forts)
      ? parsed.points_forts.filter((s: any) => typeof s === "string").slice(0, 6)
      : []
    const points_ameliorer = Array.isArray(parsed.points_ameliorer)
      ? parsed.points_ameliorer.filter((s: any) => typeof s === "string").slice(0, 6)
      : []

    const result = {
      score,
      niveau_estime: normaliserNiveau(parsed.niveau_estime, niveau_cible),
      points_forts,
      points_ameliorer,
      commentaire:
        typeof parsed.commentaire === "string" && parsed.commentaire.trim().length > 0
          ? parsed.commentaire
          : "Niveau estimé indicatif basé sur l'analyse de votre production.",
      evaluated_by: "ia"
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
