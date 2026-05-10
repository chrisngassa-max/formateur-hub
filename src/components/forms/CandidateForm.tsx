import { FormEvent, useMemo, useState } from "react";
import { resolveFunderByNaf } from "../../lib/rules";
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
  pipelineStatus: "nouveau",
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
    setCandidate((current) => {
      const next = { ...current, [key]: value, updatedAt: now() };
      if (key === "employerNaf") {
        const funder = resolveFunderByNaf(String(value));
        if (funder?.opco && !current.knownOpco) next.knownOpco = funder.opco;
      }
      if (key === "tnsNaf") {
        const funder = resolveFunderByNaf(String(value));
        if (funder?.faf && !current.knownFaf) next.knownFaf = funder.faf;
      }
      return next;
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(candidate);
  }

  const currentStep = steps[step];

  return (
    <form className="flex flex-col gap-8 w-full max-w-4xl mx-auto" onSubmit={submit}>
      {/* Stepper */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4">
        {steps.map((item, index) => (
          <button 
            type="button" 
            key={item} 
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              index === step 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
            onClick={() => setStep(index)}
          >
            {index + 1}. {item}
          </button>
        ))}
      </div>

      {currentStep === "Identite" ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <NumberField label="Solde CPF declare" value={candidate.cpfBalance} onChange={(value) => update("cpfBalance", value)} />
          <Toggle label="CPF deja mobilise" checked={candidate.cpfAlreadyUsed} onChange={(value) => update("cpfAlreadyUsed", value)} />
          <NumberField label="Budget personnel possible" value={candidate.personalBudget ?? 0} onChange={(value) => update("personalBudget", value)} />
          <Toggle label="Paiement plusieurs fois accepte" checked={Boolean(candidate.acceptsInstallments)} onChange={(value) => update("acceptsInstallments", value)} />
          
          {/* Support pour le nouveau pipelineStatus */}
          <SelectField
            label="Statut du Pipeline"
            value={candidate.pipelineStatus || "nouveau"}
            onChange={(value) => update("pipelineStatus", value as Candidate["pipelineStatus"])}
            options={[
              ["nouveau", "Nouveau (à traiter)"],
              ["contacte", "Contacté (en cours)"],
              ["qualifie", "Qualifié (éligible)"],
              ["dossier_depose", "Dossier déposé"],
              ["gagne", "Gagné (Validé)"],
              ["perdu", "Perdu"],
              ["abandonne", "Abandonné"],
              ["archive", "Archivé"],
            ]}
          />

          {/* Conservation de l'ancien dossierStatus pour compatibilité temporaire */}
          <SelectField
            label="Statut Administratif"
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
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-zinc-700">Commentaire interne</span>
            <textarea 
              value={candidate.internalComment ?? ""} 
              onChange={(event) => update("internalComment", event.target.value)} 
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
            />
          </label>
        </section>
      ) : null}

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-200">
        <button 
          type="button" 
          className="px-6 py-2 text-sm font-semibold rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50" 
          disabled={step === 0} 
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          Précédent
        </button>
        {step < steps.length - 1 ? (
          <button 
            type="button" 
            className="px-6 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700" 
            onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
          >
            Suivant
          </button>
        ) : (
          <button 
            type="submit"
            className="px-6 py-2 text-sm font-bold rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          >
            Enregistrer
          </button>
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
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <input 
        type={type} 
        value={value} 
        required={required} 
        onChange={(event) => onChange(event.target.value)} 
        className="h-11 rounded-lg border border-zinc-300 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <input 
        type="number" 
        value={Number.isFinite(value) ? value : 0} 
        onChange={(event) => onChange(Number(event.target.value))} 
        className="h-11 rounded-lg border border-zinc-300 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
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
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <select 
        value={value} 
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
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
    <label className="flex items-center gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(event) => onChange(event.target.checked)} 
        className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
      />
      <span className="text-sm font-medium text-zinc-900">{label}</span>
    </label>
  );
}
