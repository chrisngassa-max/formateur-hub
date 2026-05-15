export interface LevelStats {
  correct: number;
  total: number;
  time: number;
}

export interface SkillScores {
  CE: { score: number; count: number };
  CO: { score: number; count: number };
}

export interface Timestamps {
  temps: number;
  correct: boolean;
}

export interface ScoringResult {
  scoreFinal: number;
  niveauEstime: string;
  fiabilite: Record<string, number>;
  flags: string[];
  taux: Record<string, number>;
  pctCE: number;
  pctCO: number;
}

export function computeScoring(
  levelStats: Record<string, LevelStats>,
  skillScores: SkillScores,
  timestamps: Timestamps[]
): ScoringResult {
  // ALGORITHME DE SCORING HARDENED (Portage Python)
  const levels = ["A1", "A2", "B1", "B2"] as const;
  const poids: Record<string, number> = { A1: 5, A2: 10, B1: 15, B2: 20 };
  const medianes: Record<string, number> = { A1: 25, A2: 45, B1: 75, B2: 120 };

  const fiabilite: Record<string, number> = { A1: 1.0, A2: 1.0, B1: 1.0, B2: 1.0 };
  const flags = new Set<string>();

  // 1. CALCUL DES TAUX BRUTS PAR NIVEAU
  const taux: Record<string, number> = {};
  levels.forEach(niv => {
    taux[niv] = levelStats[niv].total > 0 ? levelStats[niv].correct / levelStats[niv].total : 0;
  });

  // 2. FIABILITÉ DE BASE (BORNAGE SOUPLE)
  for (let i = 1; i < levels.length; i++) {
    const n = levels[i], prev = levels[i-1];
    if (taux[prev] >= 0.75) fiabilite[n] = 1.0;
    else if (taux[prev] >= 0.58) fiabilite[n] = 0.7;
    else if (taux[prev] >= 0.42) {
      fiabilite[n] = 0.3;
      flags.add(`FIABILITE_FAIBLE_${n}`);
    } else {
      fiabilite[n] = 0.0;
    }
  }

  // 3. REMONTÉE PAR PREUVE (RÈGLE DES 50% SOCLE)
  for (let i = 1; i < levels.length; i++) {
    const n = levels[i], prev = levels[i-1];
    if (taux[n] >= 0.75 && taux[prev] >= 0.50) {
      fiabilite[n] = Math.max(fiabilite[n], 1.0);
      fiabilite[prev] = Math.max(fiabilite[prev], 0.85);
      flags.add(`SOCLE_${prev}_VALIDE_PAR_PREUVE_${n}`);
    }
  }

  // 4. PÉNALITÉ TEMPORELLE (NON-CASCADE)
  levels.forEach(niv => {
    const tempsMoyen = levelStats[niv].total > 0 ? levelStats[niv].time / levelStats[niv].total : 0;
    if (tempsMoyen > (medianes[niv] * 2)) {
      const nextIdx = levels.indexOf(niv) + 1;
      if (nextIdx < levels.length) {
        fiabilite[levels[nextIdx]] *= 0.7;
        flags.add(`LENTEUR_DETECTEE_EN_${niv}`);
      }
    }
  });

  // 5. INCOHÉRENCE VERTICALE
  for (let i = 1; i < levels.length; i++) {
    const n = levels[i], prev = levels[i-1];
    if (fiabilite[prev] === 0.0 && taux[n] > 0.50) {
      flags.add("PROFIL_INCOHERENT");
    }
  }

  // 6. FLAGS COMPORTEMENTAUX ET ASYMÉTRIE
  // Alerte Vitesse
  if ((levelStats.B1.time / (levelStats.B1.total || 1)) < medianes.B1/3 || 
      (levelStats.B2.time / (levelStats.B2.total || 1)) < medianes.B2/3) {
    if ((taux.B1 + taux.B2) > 0.80) {
      flags.add("ALERTE_VITESSE_INCOHERENTE");
    }
  }

  // Détection de Fatigue
  if (timestamps.length >= 9) {
    const n = timestamps.length;
    const p_tier = timestamps.slice(0, Math.floor(n/3));
    const d_tier = timestamps.slice(-Math.floor(n/3));
    
    const t_p = p_tier.reduce((acc, i) => acc + i.temps, 0) / p_tier.length;
    const t_d = d_tier.reduce((acc, i) => acc + i.temps, 0) / d_tier.length;
    const r_p = p_tier.filter(i => i.correct).length / p_tier.length;
    const r_d = d_tier.filter(i => i.correct).length / d_tier.length;
    
    if (t_p > 0 && (t_p - t_d) / t_p > 0.60 && (r_p - r_d) > 0.40) {
      flags.add("FATIGUE_DETECTEE");
    }
  }

  // Asymétrie Horizontale
  const pctCO = skillScores.CO.score / (skillScores.CO.count || 1);
  const pctCE = skillScores.CE.score / (skillScores.CE.count || 1);
  if (Math.abs(pctCO - pctCE) > 0.25) {
    flags.add("PROFIL_ASYMETRIQUE");
  }

  // 7. CALCUL SCORE ET CLASSIFICATION (Corrigé: taux * poids * fiabilite)
  // On utilise le taux (0-1) plutôt que le nombre de bonnes réponses brut pour un score équilibré
  const scoreFinal = levels.reduce((acc, niv) => {
    return acc + (taux[niv] * poids[niv]) * fiabilite[niv];
  }, 0);

  let niveauEstime = "A0";
  for (const niv of levels) {
    if (fiabilite[niv] > 0.5 && taux[niv] >= 0.50) niveauEstime = niv;
  }

  return {
    scoreFinal,
    niveauEstime,
    fiabilite,
    flags: Array.from(flags),
    taux,
    pctCE,
    pctCO
  };
}
