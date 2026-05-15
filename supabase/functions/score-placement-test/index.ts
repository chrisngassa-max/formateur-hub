import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { computeScoring, LevelStats, SkillScores, Timestamps } from './scoring.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, student_name, student_id, answers, source = 'site_externe' } = await req.json()

    if (!token || !answers) throw new Error('Données manquantes')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Récupérer le test
    const { data: test, error: testError } = await supabaseClient
      .from('placement_tests')
      .select('id, title')
      .eq('play_token', token)
      .single()

    if (testError || !test) throw new Error('Test invalide')

    // 2. Récupérer les items avec les bonnes réponses
    const { data: items, error: itemsError } = await supabaseClient
      .from('placement_test_items')
      .select('*')
      .eq('test_id', test.id)

    if (itemsError) throw itemsError

    // 3. Préparation des données pour le scoring
    const skillScores: SkillScores = { CE: { score: 0, count: 0 }, CO: { score: 0, count: 0 } }
    const levelStats: Record<string, LevelStats> = {
      A1: { correct: 0, total: 0, time: 0 },
      A2: { correct: 0, total: 0, time: 0 },
      B1: { correct: 0, total: 0, time: 0 },
      B2: { correct: 0, total: 0, time: 0 }
    }
    
    const processedAnswers = []
    const timestamps: Timestamps[] = []

    for (const item of items) {
      const studentAnswer = answers.find((a: any) => a.item_id === item.id)
      const timeSpent = studentAnswer?.time_spent || 0
      
      let isCorrect = null
      let score = 0

      if (['CE', 'CO'].includes(item.skill)) {
        isCorrect = studentAnswer?.answer === item.correct_answer
        score = isCorrect ? 1 : 0
        
        const lvl = item.level_cecrl as string
        if (levelStats[lvl]) {
          levelStats[lvl].correct += score
          levelStats[lvl].total += 1
          levelStats[lvl].time += timeSpent
        }
        
        const skill = item.skill as keyof SkillScores
        skillScores[skill].score += score
        skillScores[skill].count += 1
        
        timestamps.push({ temps: timeSpent, correct: isCorrect })
      }

      processedAnswers.push({
        item_id: item.id,
        student_answer: studentAnswer?.answer || '',
        is_correct: isCorrect,
        score: score,
        time_spent: timeSpent
      })
    }

    // 4. Appel au module de scoring pur
    const {
      scoreFinal,
      niveauEstime,
      flags,
      pctCE,
      pctCO
    } = computeScoring(levelStats, skillScores, timestamps)

    // 5. Recherche de remédiation
    const weakestSkill = (pctCO < pctCE) ? 'CO' : 'CE'

    const { data: remediation } = await supabaseClient
      .from('exercices')
      .select('id, titre, competence, niveau_vise')
      .eq('competence', weakestSkill)
      .eq('statut', 'published')
      .is('formateur_id', null)
      .limit(5)

    // 6. Analyse pédagogique par Claude
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    const analysisPrompt = `Analyse les résultats d'un élève au test "${test.title}".
Nom: ${student_name}
Niveau estimé: ${niveauEstime}
Score pondéré: ${scoreFinal.toFixed(0)}
Flags de diagnostic: ${flags.join(', ')}
Scores par compétence:
- CE: ${(pctCE * 100).toFixed(0)}%
- CO: ${(pctCO * 100).toFixed(0)}%

Produis un bilan pédagogique court (3-4 phrases) avec :
1. Les points forts (basés sur les compétences réussies)
2. Les axes d'amélioration
3. Le groupe conseillé (A1, A2, B1)
4. Un conseil de parcours (ex: "Focus administratif", "Renforcement oral")

IMPORTANT: Si le flag ALERTE_VITESSE_INCOHERENTE ou PROFIL_INCOHERENT est présent, mentionne qu'un entretien humain est nécessaire pour valider le niveau.

Retourne un JSON :
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommended_group": "...",
  "recommended_pathway": "...",
  "teacher_notes": "..."
}`

    let pedagogicalAnalysis = {
      strengths: [], weaknesses: [], recommended_group: "", recommended_pathway: "", teacher_notes: "Analyse non disponible."
    }

    try {
      if (CLAUDE_API_KEY) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{ role: 'user', content: analysisPrompt }],
          }),
        })
        const claudeData = await response.json()
        if (claudeData.content && claudeData.content[0]) {
           pedagogicalAnalysis = JSON.parse(claudeData.content[0].text)
        }
      }
    } catch (e) {
      console.error("Claude API error", e)
    }

    // 7. Enregistrement de la tentative
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('placement_test_attempts')
      .insert({
        test_id: test.id,
        student_id: student_id || null,
        student_name: student_name,
        status: 'completed',
        total_score: scoreFinal,
        max_score: 100, // TODO: Compute max possible score based on items
        estimated_level: niveauEstime,
        source: source,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (attemptError) throw attemptError

    // 8. Enregistrement des réponses
    await supabaseClient.from('placement_test_answers').insert(
      processedAnswers.map(a => ({ ...a, attempt_id: attempt.id }))
    )

    // 9. Enregistrement du résultat détaillé
    const resultData = {
      attempt_id: attempt.id,
      global_level: niveauEstime,
      ce_level: niveauEstime, 
      co_level: niveauEstime,
      global_score_pct: (scoreFinal / 500) * 100, // Based on max weights
      ce_score_pct: pctCE * 100,
      co_score_pct: pctCO * 100,
      strengths: pedagogicalAnalysis.strengths || [],
      weaknesses: pedagogicalAnalysis.weaknesses || [],
      recommended_group: pedagogicalAnalysis.recommended_group || "",
      recommended_pathway: pedagogicalAnalysis.recommended_pathway || "",
      teacher_notes: pedagogicalAnalysis.teacher_notes || "",
      remediation_exercises: remediation || [],
      raw_analysis: pedagogicalAnalysis,
      flags: flags
    }

    await supabaseClient.from('placement_test_results').insert(resultData)

    return new Response(JSON.stringify({ 
      success: true, 
      attempt_id: attempt.id,
      result: resultData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
