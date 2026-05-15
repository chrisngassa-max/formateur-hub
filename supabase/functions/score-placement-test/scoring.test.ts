import assert from "node:assert";
import { computeScoring, LevelStats, SkillScores, Timestamps } from "./scoring.ts";

function assertEquals(actual: any, expected: any, message?: string) {
  assert.strictEqual(actual, expected, message);
}

function createEmptyStats(): Record<string, LevelStats> {
  return {
    A1: { correct: 0, total: 10, time: 200 },
    A2: { correct: 0, total: 10, time: 400 },
    B1: { correct: 0, total: 10, time: 700 },
    B2: { correct: 0, total: 10, time: 1000 },
  };
}

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (err: any) {
    console.error(`❌ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

test("Profil 6: Lecteur lent - non-cascade des pénalités temporelles", () => {
  const stats = createEmptyStats();
  
  // A1 lent (tempsMoyen = 51, médiane = 25 -> > 50)
  stats.A1.correct = 10;
  stats.A1.time = 510; 
  // A2 normal
  stats.A2.correct = 10;
  stats.A2.time = 400; 
  // B1 lent (tempsMoyen = 151, médiane = 75 -> > 150)
  stats.B1.correct = 10;
  stats.B1.time = 1510;
  // B2 normal
  stats.B2.correct = 10;
  stats.B2.time = 1000;

  const skillScores = { CE: { score: 20, count: 20 }, CO: { score: 20, count: 20 } };
  const timestamps: Timestamps[] = []; // Ignore for this test

  const result = computeScoring(stats, skillScores, timestamps);

  // A1 lent -> pénalité sur A2 (0.7)
  // B1 lent -> pénalité sur B2 (0.7)
  // La pénalité de A1 sur A2 ne doit PAS cascader sur B1, B1 n'est pas pénalisé par A2.
  assertEquals(result.fiabilite["A2"], 0.7);
  assertEquals(result.fiabilite["B1"], 1.0); // B1 n'a pas hérité de la pénalité de A2
  
  // Vérification critique 8 : fiabilité finale de B2 est 0.7 (et pas 0.34)
  assertEquals(result.fiabilite["B2"], 0.7);
});

test("Profil 9: Miraculé - remontée par preuve avec socle insuffisant", () => {
  const stats = createEmptyStats();
  
  stats.A1.correct = 10; // 100%
  stats.A2.correct = 3;  // 30% (< 50%)
  stats.B1.correct = 9;  // 90% (>= 75%)
  stats.B2.correct = 0;  // 0%

  const skillScores = { CE: { score: 11, count: 20 }, CO: { score: 11, count: 20 } };
  const timestamps: Timestamps[] = []; 

  const result = computeScoring(stats, skillScores, timestamps);

  // A2 est à 30%, B1 est à 90%.
  // La règle des 50% socle ne doit pas s'activer car taux[prev] < 0.50
  
  // Vérification critique 9 : SOCLE_A2_VALIDE_PAR_PREUVE_B1 est absent
  assert(!result.flags.includes("SOCLE_A2_VALIDE_PAR_PREUVE_B1"));
  
  // Fiabilité A2 = 0 (car taux A1 = 100%, fiabilité A2 = 1.0, mais taux A2=30% -> fiabilité B1=0.0)
  // Wait, fiabilite de B1:
  // taux[A2] = 0.3. Donc fiabilite[B1] = 0.0
  assertEquals(result.fiabilite["B1"], 0.0);
});

test("Profil Incohérent: Fiabilité 0 et taux > 50%", () => {
  const stats = createEmptyStats();
  
  stats.A1.correct = 3;  // 30% -> fiabilite[A2] = 0.0
  stats.A2.correct = 2;  // 20%
  stats.B1.correct = 6;  // 60% -> > 50% while fiabilite[A2] = 0.0 !

  const skillScores = { CE: { score: 10, count: 20 }, CO: { score: 9, count: 20 } };
  const timestamps: Timestamps[] = []; 

  const result = computeScoring(stats, skillScores, timestamps);

  assert(result.flags.includes("PROFIL_INCOHERENT"));
});

test("Détection de Fatigue", () => {
  const stats = createEmptyStats();
  const skillScores = { CE: { score: 10, count: 20 }, CO: { score: 10, count: 20 } };
  const timestamps: Timestamps[] = [];
  
  // 9 items
  // Premier tiers : temps longs (20s), tous corrects
  timestamps.push({ temps: 20, correct: true }, { temps: 20, correct: true }, { temps: 20, correct: true });
  // Deuxième tiers : moyen
  timestamps.push({ temps: 15, correct: true }, { temps: 15, correct: false }, { temps: 15, correct: false });
  // Dernier tiers : temps très courts (5s, chute > 60%), tous faux (chute = 100% > 40%)
  timestamps.push({ temps: 5, correct: false }, { temps: 5, correct: false }, { temps: 5, correct: false });

  const result = computeScoring(stats, skillScores, timestamps);

  assert(result.flags.includes("FATIGUE_DETECTEE"));
});

test("Vitesse incohérente", () => {
  const stats = createEmptyStats();
  
  // (taux.B1 + taux.B2) > 0.80 -> ex: 0.5 + 0.5 = 1.0 > 0.80
  stats.B1.correct = 5; // 50%
  stats.B2.correct = 5; // 50%
  
  // Temps trop rapide : médiane B1 = 75. 75/3 = 25. On met 20.
  stats.B1.time = 200; // 200/10 = 20 temps moyen
  stats.B2.time = 1200; // Normal

  const skillScores = { CE: { score: 5, count: 10 }, CO: { score: 5, count: 10 } };
  const timestamps: Timestamps[] = []; 

  const result = computeScoring(stats, skillScores, timestamps);

  assert(result.flags.includes("ALERTE_VITESSE_INCOHERENTE"));
});

test("Profil 1: Standard A1", () => {
  const stats = createEmptyStats();
  stats.A1.correct = 8; // 80%
  stats.A2.correct = 2; // 20%
  
  const skillScores = { CE: { score: 10, count: 20 }, CO: { score: 10, count: 20 } };
  const timestamps: Timestamps[] = []; 

  const result = computeScoring(stats, skillScores, timestamps);
  assertEquals(result.niveauEstime, "A1");
});

test("Profil 2: Standard A2", () => {
  const stats = createEmptyStats();
  stats.A1.correct = 10; // 100%
  stats.A2.correct = 8; // 80%
  stats.B1.correct = 2; // 20%

  const skillScores = { CE: { score: 10, count: 20 }, CO: { score: 10, count: 20 } };
  const timestamps: Timestamps[] = []; 

  const result = computeScoring(stats, skillScores, timestamps);
  assertEquals(result.niveauEstime, "A2");
});

test("Profil 3: Standard B1", () => {
  const stats = createEmptyStats();
  stats.A1.correct = 10; 
  stats.A2.correct = 10; 
  stats.B1.correct = 8; // 80%
  stats.B2.correct = 2; // 20%

  const skillScores = { CE: { score: 10, count: 20 }, CO: { score: 10, count: 20 } };
  const timestamps: Timestamps[] = []; 

  const result = computeScoring(stats, skillScores, timestamps);
  assertEquals(result.niveauEstime, "B1");
});

test("Profil 4: Standard B2", () => {
  const stats = createEmptyStats();
  stats.A1.correct = 10; 
  stats.A2.correct = 10; 
  stats.B1.correct = 10; 
  stats.B2.correct = 8; // 80%

  const skillScores = { CE: { score: 10, count: 20 }, CO: { score: 10, count: 20 } };
  const timestamps: Timestamps[] = []; 

  const result = computeScoring(stats, skillScores, timestamps);
  assertEquals(result.niveauEstime, "B2");
});

