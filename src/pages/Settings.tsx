import { useState } from "react";
import { pointsToVerify, thresholds } from "../lib/rules";
import { formatCurrency } from "../lib/format";
import { fetchCandidates } from "../lib/candidatesRepo";
import { importLocalAndSeedToCloud, loadLocalCandidates, clearLocalCandidates } from "../lib/migration";
import { useAuth } from "../lib/auth";

export function Settings() {
  const { user, roles, isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const localCount = loadLocalCandidates().length;

  async function runImport(opts: { includeSeeds: boolean; includeLocal: boolean }) {
    if (!user) return;
    setBusy(true);
    setReport(null);
    try {
      const existing = await fetchCandidates();
      const ids = new Set(existing.map((c) => c.id));
      const res = await importLocalAndSeedToCloud(user.id, ids, opts);
      setReport(`Import terminé : ${res.imported} ajoutés, ${res.skipped} ignorés (doublons).`);
    } catch (e) {
      setReport(`Erreur : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Paramètres</p>
          <h2>Configuration & règles</h2>
          <p>Connecté en tant que {user?.email} — rôles : {roles.join(", ") || "—"}</p>
        </div>
      </header>

      <section className="panel">
        <h3>Import des données</h3>
        <p>Migration depuis le stockage local et seeds de démonstration vers Lovable Cloud.</p>
        <p style={{ opacity: 0.7 }}>{localCount} candidat(s) détecté(s) dans le navigateur.</p>
        <div className="header-actions" style={{ flexWrap: "wrap", gap: 8 }}>
          <button className="secondary" disabled={busy} onClick={() => runImport({ includeSeeds: true, includeLocal: true })}>
            Importer locaux + seeds démo
          </button>
          <button className="secondary" disabled={busy || localCount === 0} onClick={() => runImport({ includeSeeds: false, includeLocal: true })}>
            Importer uniquement les locaux
          </button>
          <button className="secondary" disabled={busy} onClick={() => runImport({ includeSeeds: true, includeLocal: false })}>
            Charger seeds démo
          </button>
          {localCount > 0 && (
            <button className="danger" disabled={busy} onClick={() => { clearLocalCandidates(); setReport("LocalStorage vidé."); }}>
              Vider le localStorage
            </button>
          )}
        </div>
        {report && <p style={{ marginTop: 12 }}>{report}</p>}
      </section>

      <section className="panel">
        <h3>Règles indicatives</h3>
        <dl className="breakdown">
          <div><dt>Forfait CPF 2026</dt><dd>{formatCurrency(thresholds.cpfFlatFee)}</dd></div>
          <div><dt>Plafond CPF certifications RS</dt><dd>{formatCurrency(thresholds.cpfRsCap)}</dd></div>
          <div><dt>Plafond bilan de compétences</dt><dd>{formatCurrency(thresholds.cpfBilanCap)}</dd></div>
          <div><dt>ARE-F</dt><dd>Formation &gt; {thresholds.areMinHours} h</dd></div>
          <div><dt>Période de reconversion</dt><dd>{thresholds.periodReconversionMinHours} h à {thresholds.periodReconversionStandardMaxHours} h</dd></div>
          <div><dt>Seuil prioritaire</dt><dd>Score ≥ {thresholds.priorityFinancingScore} et complétude ≥ {thresholds.priorityCompletionScore} %</dd></div>
          <div><dt>Mode stockage</dt><dd>Lovable Cloud (Supabase)</dd></div>
        </dl>
      </section>

      <section className="panel">
        <h3>Points de vigilance</h3>
        <ul className="clean-list warning-list">
          {pointsToVerify.slice(0, 5).map((p) => (
            <li key={String(p.id)}><strong>{String(p.subject)}</strong> — {String(p.action)}</li>
          ))}
        </ul>
      </section>

      {isAdmin && (
        <section className="panel">
          <h3>Administration</h3>
          <p>Vous êtes administrateur. La gestion fine des utilisateurs sera ajoutée prochainement.</p>
        </section>
      )}

      <p className="legal-note">
        Cette projection est indicative et ne constitue pas une décision officielle de financement.
      </p>
    </div>
  );
}
