import { FormEvent, useMemo, useState } from "react";
import type { Candidate } from "../../types/candidate";

type CandidateFormProps = {
  initialCandidate?: Candidate;
  onSubmit: (candidate: Candidate) => void;
};

const now = () => new Date().toISOString();

const defaultCandidate: Candidate = {
  id: "",
  createdAt: "",
  updatedAt: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  postalCode: "",
  nationality: "",
  status: "demandeur_emploi",
  registeredFranceTravail: false,
  receivesAre: false,
  hasRqth: false,
  diplomaLevel: "bac",
  trainingType: "fle",
  trainingName: "",
  projectGoal: "emploi",
  trainingHours: 40,
  trainingCostHt: 1200,
  isCertified: true,
  registryType: "rs",
  cpfBalance: 0,
  cpfAlreadyUsed: false,
  acceptsInstallments: true,
  opcoManualCoverageRate: 0.62,
  dossierStatus: "nouveau",
};

export function CandidateForm({ initialCandidate, onSubmit }: CandidateFormProps) {
  const [step, setStep] = useState(0);
  const [candidate, setCandidate] = useState<Candidate>(() => ({
    ...defaultCandidate,
    ...initialCandidate,
    id: initialCandidate?.id ?? crypto.randomUUID(),
    createdAt: initialCandidate?.createdAt ?? now(),
    updatedAt: now(),
  }));

  const isEmployee = candidate.status === "salarie_cdi" || candidate.status === "salarie_cdd";
  const isTns = candidate.status === "tns" || candidate.status === "auto_entrepreneur";
  const steps = useMemo(
    () =>
      [
        "Identite",
        "Situation",
        isEmployee ? "Employeur" : null,
        isTns ? "Independant" : null,
        "Formation",
        "Dossier",
        "Financement",
      ].filter(Boolean) as string[],
    [isEmployee, isTns]
  );

  function update<K extends keyof Candidate>(key: K, value: Candidate[K]) {
    setCandidate((current) => ({ ...current, [key]: value, updatedAt: now() }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(candidate);
  }

  const currentStep = steps[step];

  return (
    <form className="candidate-form" onSubmit={submit}>
      <div className="stepper">
        {steps.map((item, index) => (
          <button type="button" key={item} className={index === step ? "active" : ""} onClick={() => setStep(index)}>
            {index + 1}. {item}
          </button>
        ))}
      </div>

      {currentStep === "Identite" ? (
        <section className="form-section">
          <Field label="Prenom" value={candidate.firstName} onChange={(value) => update("firstName", value)} required />
          <Field label="Nom" value={candidate.lastName} onChange={(value) => update("lastName", value)} required />
          <Field label="Email" type="email" value={candidate.email} onChange={(value) => update("email", value)} required />
          <Field label="Telephone" value={candidate.phone} onChange={(value) => update("phone", value)} required />
          <Field label="Date naissance" type="date" value={candidate.birthDate ?? ""} onChange={(value) => update("birthDate", value)} />
          <Field label="Ville" value={candidate.city ?? ""} onChange={(value) => update("city", value)} />
          <Field label="Code postal" value={candidate.postalCode ?? ""} onChange={(value) => update("postalCode", value)} />
          <Field label="Nationalite" value={candidate.nationality ?? ""} onChange={(value) => update("nationality", value)} />
        </section>
      ) : null}

      {currentStep === "Situation" ? (
        <section className="form-section">
          <SelectField
            label="Statut"
            value={candidate.status}
            onChange={(value) => update("status", value as Candidate["status"])}
            options={[
              ["salarie_cdi", "Salarie CDI"],
              ["salarie_cdd", "Salarie CDD"],
              ["demandeur_emploi", "Demandeur d'emploi"],
              ["tns", "TNS"],
              ["auto_entrepreneur", "Auto-entrepreneur"],
              ["etudiant", "Etudiant"],
              ["sans_activite", "Sans activite"],
              ["autre", "Autre"],
            ]}
          />
          <SelectField
            label="Niveau diplome"
            value={candidate.diplomaLevel}
            onChange={(value) => update("diplomaLevel", value as Candidate["diplomaLevel"])}
            options={[
              ["infra_bac", "Infra Bac"],
              ["bac", "Bac"],
              ["bac2", "Bac+2"],
              ["bac3_plus", "Bac+3 ou plus"],
            ]}
          />
          <Toggle label="Inscrit France Travail" checked={candidate.registeredFranceTravail} onChange={(value) => update("registeredFranceTravail", value)} />
          <Toggle label="Allocation ARE" checked={candidate.receivesAre} onChange={(value) => update("receivesAre", value)} />
          <NumberField label="Duree chomage (mois)" value={candidate.unemploymentMonths ?? 0} onChange={(value) => update("unemploymentMonths", value)} />
          <Toggle label="RQTH / handicap reconnu" checked={candidate.hasRqth} onChange={(value) => update("hasRqth", value)} />
        </section>
      ) : null}

      {currentStep === "Employeur" ? (
        <section className="form-section">
          <Field label="Nom employeur" value={candidate.employerName ?? ""} onChange={(value) => update("employerName", value)} />
          <Field label="SIRET employeur" value={candidate.employerSiret ?? ""} onChange={(value) => update("employerSiret", value)} />
          <Field label="Code NAF" value={candidate.employerNaf ?? ""} onChange={(value) => update("employerNaf", value)} />
          <NumberField label="Nombre salaries" value={candidate.employerSize ?? 0} onChange={(value) => update("employerSize", value)} />
          <Field label="Email employeur" type="email" value={candidate.employerEmail ?? ""} onChange={(value) => update("employerEmail", value)} />
          <Field label="Telephone employeur" value={candidate.employerPhone ?? ""} onChange={(value) => update("employerPhone", value)} />
          <Field label="OPCO connu" value={candidate.knownOpco ?? ""} onChange={(value) => update("knownOpco", value)} />
          <NumberField label="Taux prise en charge OPCO (0 a 1)" value={candidate.opcoManualCoverageRate ?? 0.62} onChange={(value) => update("opcoManualCoverageRate", value)} />
          <Toggle label="Cofinancement employeur possible" checked={Boolean(candidate.employerCofundingPossible)} onChange={(value) => update("employerCofundingPossible", value)} />
        </section>
      ) : null}

      {currentStep === "Independant" ? (
        <section className="form-section">
          <Field label="SIRET" value={candidate.tnsSiret ?? ""} onChange={(value) => update("tnsSiret", value)} />
          <Field label="Code NAF" value={candidate.tnsNaf ?? ""} onChange={(value) => update("tnsNaf", value)} />
          <SelectField
            label="Type activite"
            value={candidate.tnsActivityType ?? "autre"}
            onChange={(value) => update("tnsActivityType", value as Candidate["tnsActivityType"])}
            options={[
              ["liberal", "Liberal"],
              ["artisan", "Artisan"],
              ["commercant", "Commercant"],
              ["service", "Service"],
              ["autre", "Autre"],
            ]}
          />
          <Field label="FAF connu" value={candidate.knownFaf ?? ""} onChange={(value) => update("knownFaf", value)} />
        </section>
      ) : null}

      {currentStep === "Formation" ? (
        <section className="form-section">
          <SelectField
            label="Type formation"
            value={candidate.trainingType}
            onChange={(value) => update("trainingType", value as Candidate["trainingType"])}
            options={[
              ["fle", "FLE"],
              ["tcf_irn", "TCF IRN"],
              ["tcf_tp", "TCF TP"],
              ["anglais_pro", "Anglais professionnel"],
              ["cloe", "CLOE"],
              ["lilate", "LILATE"],
              ["bilan_vae", "Bilan / VAE"],
              ["autre", "Autre"],
            ]}
          />
          <Field label="Nom formation" value={candidate.trainingName} onChange={(value) => update("trainingName", value)} required />
          <SelectField
            label="Objectif"
            value={candidate.projectGoal}
            onChange={(value) => update("projectGoal", value as Candidate["projectGoal"])}
            options={[
              ["emploi", "Emploi"],
              ["evolution", "Evolution"],
              ["reconversion", "Reconversion"],
              ["mobilite", "Mobilite"],
              ["naturalisation", "Naturalisation"],
              ["autorisation_travail", "Autorisation de travail"],
              ["creation_entreprise", "Creation entreprise"],
              ["autre", "Autre"],
            ]}
          />
          <NumberField label="Duree (heures)" value={candidate.trainingHours} onChange={(value) => update("trainingHours", value)} />
          <NumberField label="Cout HT" value={candidate.trainingCostHt} onChange={(value) => update("trainingCostHt", value)} />
          <Toggle label="Formation certifiante" checked={candidate.isCertified} onChange={(value) => update("isCertified", value)} />
          <SelectField
            label="Repertoire"
            value={candidate.registryType}
            onChange={(value) => update("registryType", value as Candidate["registryType"])}
            options={[
              ["rncp", "RNCP"],
              ["rs", "RS"],
              ["non_certifiante", "Non certifiante"],
              ["inconnu", "Inconnu"],
            ]}
          />
          <Field label="Certification" value={candidate.certificationName ?? ""} onChange={(value) => update("certificationName", value)} />
        </section>
      ) : null}

      {currentStep === "Dossier" ? (
        <section className="form-section">
          <Toggle label="OF certifie Qualiopi" checked={Boolean(candidate.isQualiopiProvider)} onChange={(value) => update("isQualiopiProvider", value)} />
          <Field label="Date debut formation" type="date" value={candidate.trainingStartDate?.slice(0, 10) ?? ""} onChange={(value) => update("trainingStartDate", value ? new Date(value).toISOString() : undefined)} />
          <Toggle label="Formation sur temps de travail" checked={Boolean(candidate.trainingDuringWorkTime)} onChange={(value) => update("trainingDuringWorkTime", value)} />
          <SelectField
            label="Accord employeur"
            value={candidate.employerAgreementStatus ?? "inconnu"}
            onChange={(value) => update("employerAgreementStatus", value as Candidate["employerAgreementStatus"])}
            options={[
              ["inconnu", "Inconnu"],
              ["oui", "Oui"],
              ["non", "Non"],
            ]}
          />
          <NumberField label="Bareme OPCO connu (EUR/h)" value={candidate.opcoHourlyRate ?? 0} onChange={(value) => update("opcoHourlyRate", value)} />
          <NumberField label="Plafond OPCO total" value={candidate.opcoFlatCap ?? 0} onChange={(value) => update("opcoFlatCap", value)} />
          <Toggle label="Emargements collectes" checked={Boolean(candidate.attendanceSheetsCollected)} onChange={(value) => update("attendanceSheetsCollected", value)} />
          <Toggle label="Certificat de realisation collecte" checked={Boolean(candidate.completionCertificateCollected)} onChange={(value) => update("completionCertificateCollected", value)} />
          <Toggle label="Attestation assiduite collectee" checked={Boolean(candidate.attendanceCertificateCollected)} onChange={(value) => update("attendanceCertificateCollected", value)} />
          <Toggle label="Facture emise" checked={Boolean(candidate.invoiceIssued)} onChange={(value) => update("invoiceIssued", value)} />
          <Toggle label="Paiement declenche" checked={Boolean(candidate.paymentTriggered)} onChange={(value) => update("paymentTriggered", value)} />
        </section>
      ) : null}

      {currentStep === "Financement" ? (
        <section className="form-section">
          <NumberField label="Solde CPF declare" value={candidate.cpfBalance} onChange={(value) => update("cpfBalance", value)} />
          <Toggle label="CPF deja mobilise" checked={candidate.cpfAlreadyUsed} onChange={(value) => update("cpfAlreadyUsed", value)} />
          <NumberField label="Budget personnel possible" value={candidate.personalBudget ?? 0} onChange={(value) => update("personalBudget", value)} />
          <Toggle label="Paiement plusieurs fois accepte" checked={Boolean(candidate.acceptsInstallments)} onChange={(value) => update("acceptsInstallments", value)} />
          <SelectField
            label="Statut dossier"
            value={candidate.dossierStatus}
            onChange={(value) => update("dossierStatus", value as Candidate["dossierStatus"])}
            options={[
              ["nouveau", "Nouveau"],
              ["a_completer", "A completer"],
              ["prioritaire", "Prioritaire"],
              ["pret_a_envoyer", "Pret a envoyer"],
              ["cofinancement_a_verifier", "Cofinancement a verifier"],
              ["paiement_a_proposer", "Paiement a proposer"],
              ["envoye", "Envoye"],
              ["relance", "Relance"],
              ["en_cours", "En cours"],
              ["a_justifier", "A justifier"],
              ["paiement_declenche", "Paiement declenche"],
              ["clos", "Clos"],
              ["accepte", "Accepte"],
              ["refuse", "Refuse"],
              ["transmis", "Transmis"],
              ["abandonne", "Abandonne"],
            ]}
          />
          <Field label="Date envoi dossier" type="date" value={candidate.sentAt?.slice(0, 10) ?? ""} onChange={(value) => update("sentAt", value ? new Date(value).toISOString() : undefined)} />
          <label className="field wide">
            Commentaire interne
            <textarea value={candidate.internalComment ?? ""} onChange={(event) => update("internalComment", event.target.value)} />
          </label>
        </section>
      ) : null}

      <div className="form-actions">
        <button type="button" className="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          Precedent
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
            Suivant
          </button>
        ) : (
          <button type="submit">Enregistrer</button>
        )}
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
};

function Field({ label, value, type = "text", required, onChange }: FieldProps) {
  return (
    <label className="field">
      {label}
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      {label}
      <input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
