import type { Candidate } from "../types/candidate";
import { loadAppSettings, type AppSettings } from "./appSettings";

export function createEmptyCandidate(settings: AppSettings = loadAppSettings()): Candidate {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
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
    isQualiopiProvider: settings.defaultQualiopiProvider,
    cpfBalance: 0,
    cpfAlreadyUsed: false,
    acceptsInstallments: true,
    opcoManualCoverageRate: 0.62,
    dossierStatus: "nouveau",
    pipelineStatus: "nouveau",
  };
}
