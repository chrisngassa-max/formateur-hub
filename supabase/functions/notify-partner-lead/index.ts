import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const PARTNER_EMAIL = Deno.env.get('PARTNER_EMAIL') || 'contact@partenaire.fr'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dossier_id } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Récupérer les détails du dossier
    const { data: dossier, error: dossierError } = await supabaseClient
      .from('dossiers')
      .select('*')
      .eq('id', dossier_id)
      .single()

    if (dossierError || !dossier) throw new Error('Dossier introuvable')

    // 2. Préparation du contenu de l'email
    const { pedagogy, administration, finances } = dossier.context
    
    const emailHtml = `
      <h1>Nouvelle Fiche Prospect Qualifiée</h1>
      <p>Un nouveau candidat a validé sa faisabilité de financement.</p>
      
      <hr />
      <h3>Informations Candidat</h3>
      <ul>
        <li><strong>Nom :</strong> ${dossier.student_name}</li>
        <li><strong>Niveau détecté :</strong> ${pedagogy?.current_level}</li>
        <li><strong>Priorité :</strong> ${dossier.priority}</li>
      </ul>

      <h3>Détails Administratifs</h3>
      <ul>
        <li><strong>Statut :</strong> ${administration?.student_status}</li>
        <li><strong>SIRET/NAF :</strong> ${administration?.declarative_info?.hasSiret ? 'Disponible' : 'À demander'}</li>
        <li><strong>Entreprise < 50 sal. :</strong> ${administration?.declarative_info?.isSmallCompany ? 'Oui' : 'Non'}</li>
      </ul>

      <h3>Analyse Predict</h3>
      <p><strong>Faisabilité estimée :</strong> ${finances?.feasibility_label} (${finances?.feasibility_score}%)</p>
      
      <hr />
      <p><em>Cette fiche est stockée dans votre dashboard sous l'ID : ${dossier.id}</em></p>
    `

    // 3. Envoi via Resend
    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Bilan Français <notifications@votre-domaine.fr>',
          to: [PARTNER_EMAIL],
          subject: `[LEAD ${dossier.priority.toUpperCase()}] ${dossier.student_name} - Faisabilité ${finances?.feasibility_label}`,
          html: emailHtml,
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(`Erreur Resend: ${error}`)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
