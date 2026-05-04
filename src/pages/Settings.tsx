import { pointsToVerify, thresholds } from "../lib/rules";
import { formatCurrency } from "../lib/format";

export function Settings() {
  return (
    <div className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Paramètres métier</p>
          <h2>Règles indicatives Phase 1</h2>
          <p>Lecture seule pour le MVP. Ces valeurs seront paramétrables en Phase 2.</p>
        </div>
      </header>
      <section className="panel">
        <dl className="breakdown">
          <div>
            <dt>Forfait CPF 2026</dt>
            <dd>{formatCurrency(thresholds.cpfFlatFee)}</dd>
          </div>
          <div>
            <dt>Plafond CPF certifications RS</dt>
            <dd>{formatCurrency(thresholds.cpfRsCap)}</dd>
          </div>
          <div>
            <dt>Plafond bilan de compétences</dt>
            <dd>{formatCurrency(thresholds.cpfBilanCap)}</dd>
          </div>
          <div>
            <dt>ARE-F</dt>
            <dd>Formation &gt; {thresholds.areMinHours} h</dd>
          </div>
          <div>
            <dt>Période de reconversion</dt>
            <dd>
              {thresholds.periodReconversionMinHours} h à {thresholds.periodReconversionStandardMaxHours} h
            </dd>
          </div>
          <div>
            <dt>Seuil prioritaire</dt>
            <dd>
              Score ≥ {thresholds.priorityFinancingScore} et complétude ≥ {thresholds.priorityCompletionScore} %
            </dd>
          </div>
          <div>
            <dt>Mode stockage</dt>
            <dd>localStorage navigateur</dd>
          </div>
        </dl>
      </section>
      <section className="panel">
        <h3>Points de vigilance</h3>
        <ul className="clean-list warning-list">
          {pointsToVerify.slice(0, 5).map((point) => (
            <li key={String(point.id)}>
              <strong>{String(point.subject)}</strong> — {String(point.action)}
            </li>
          ))}
        </ul>
      </section>
      <p className="legal-note">
        Cette projection est indicative et ne constitue pas une décision officielle de financement. Les aides proposées doivent être vérifiées auprès des organismes concernés.
      </p>
    </div>
  );
}
