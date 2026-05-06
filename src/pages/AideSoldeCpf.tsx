import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, PhoneCall, RotateCcw } from "lucide-react";
import { AIDE_CPF_STEPS } from "../data/aideCpfSteps";

const MON_COMPTE_FORMATION_URL = "https://www.moncompteformation.gouv.fr/";
const ADVISOR_PHONE = "";

export function AideSoldeCpf() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const step = AIDE_CPF_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === AIDE_CPF_STEPS.length - 1;
  const progress = ((currentStep + 1) / AIDE_CPF_STEPS.length) * 100;

  const advisorHref = useMemo(() => {
    return ADVISOR_PHONE ? `tel:${ADVISOR_PHONE.replace(/\s/g, "")}` : undefined;
  }, []);

  function goToPrevious() {
    setIsDone(false);
    setCurrentStep((value) => Math.max(0, value - 1));
  }

  function goToNext() {
    setIsDone(false);
    setCurrentStep((value) => Math.min(AIDE_CPF_STEPS.length - 1, value + 1));
  }

  function restart() {
    setIsDone(false);
    setCurrentStep(0);
  }

  return (
    <main className="aide-page">
      <header className="aide-topbar">
        <div>
          <p className="eyebrow">FormaPredict</p>
          <h1>Aide pour trouver votre solde CPF</h1>
        </div>
        <a className="button secondary" href={MON_COMPTE_FORMATION_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={18} aria-hidden="true" />
          Ouvrir le site
        </a>
      </header>

      <section className="aide-progress-panel" aria-label={`Etape ${step.id} sur ${AIDE_CPF_STEPS.length}`}>
        <div className="aide-progress-heading">
          <strong>Etape {step.id} / {AIDE_CPF_STEPS.length}</strong>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="aide-progress-track">
          <div className="aide-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="aide-step">
        <div className="aide-image-frame">
          <img className="aide-step-image" src={step.image} alt={`Capture d'ecran de l'etape ${step.id}`} />
        </div>

        <div className="aide-copy">
          <h2>{step.title}</h2>
          <p className="aide-instruction">{step.instruction}</p>
          {step.hint ? <p className="aide-hint">{step.hint}</p> : null}
        </div>
      </section>

      {isDone ? (
        <section className="aide-done" aria-live="polite">
          <CheckCircle2 size={22} aria-hidden="true" />
          <div>
            <h2>Bravo, vous avez trouve votre solde.</h2>
            <p>Donnez le montant en euros a votre conseiller.</p>
          </div>
        </section>
      ) : null}

      <nav className="aide-actions" aria-label="Navigation du tutoriel">
        <button className="secondary" onClick={goToPrevious} disabled={isFirst}>
          <ArrowLeft size={18} aria-hidden="true" />
          Precedent
        </button>

        {isLast ? (
          <button onClick={() => setIsDone(true)}>
            <CheckCircle2 size={18} aria-hidden="true" />
            J'ai mon solde
          </button>
        ) : (
          <button onClick={goToNext}>
            Suivant
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </nav>

      <footer className="aide-footer">
        <a href={MON_COMPTE_FORMATION_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={18} aria-hidden="true" />
          Ouvrir Mon Compte Formation
        </a>
        {advisorHref ? (
          <a href={advisorHref}>
            <PhoneCall size={18} aria-hidden="true" />
            Appeler mon conseiller
          </a>
        ) : (
          <span className="aide-disabled-link">
            <PhoneCall size={18} aria-hidden="true" />
            Appeler mon conseiller
          </span>
        )}
        <button className="secondary aide-reset" onClick={restart}>
          <RotateCcw size={18} aria-hidden="true" />
          Recommencer
        </button>
      </footer>
    </main>
  );
}
