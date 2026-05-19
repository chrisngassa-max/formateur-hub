/**
 * DossierContext.ts - Contrat d'interface unifié (V2)
 * Source de vérité pour le Hub Bilan & Predict
 */

export type StudentStatus = 'salarie' | 'demandeur_emploi' | 'independant' | 'etudiant' | 'autre';

export type DeliveryMode = 'presentiel' | 'distanciel' | 'hybride';

export type TrackType = 'progression' | 'maintien' | 'intensif';

export type DocumentStatus = 'present' | 'missing' | 'pending_verification' | 'rejected';

export type PipelineStatus = 
  | 'nouveau' 
  | 'en_qualification' 
  | 'en_attente_candidat' 
  | 'pret_a_deposer' 
  | 'depose' 
  | 'gagne' 
  | 'perdu' 
  | 'archive';

export interface DossierMetadata {
  dossier_id: string;
  external_ref?: string;
  created_at: string;
  updated_at: string;
  source: string;
  assigned_to?: string;
}

export interface PedagogyContext {
  current_level: string;
  target_level: string;
  skill_scores: Record<string, number | null>;
  reliability_flags: string[];
  training_recommendation: {
    catalog_id: string;
    track_type: TrackType;
    delivery_mode: DeliveryMode;
    recommended_hours: number;
    certification_target: string;
    estimated_duration_weeks?: number;
  };
}

export interface AdministrationContext {
  student_status: StudentStatus;
  company?: {
    siret: string;
    naf: string;
    opco: string;
    size_bracket: '<50' | '50-250' | '>250';
  };
  is_rqth: boolean;
  france_travail_id?: string | null;
}

export interface FinancialProjection {
  aides_total: number;
  rac: number;
  detail: string;
}

export interface FinancesContext {
  solde_cpf: number;
  projections: {
    prudent: FinancialProjection;
    moyen: FinancialProjection;
    optimiste: FinancialProjection;
  };
  last_calculation_at?: string;
}

export interface DossierDocument {
  code: string;
  label: string;
  status: DocumentStatus;
}

export interface DocumentsContext {
  checklist: DossierDocument[];
  completion_score_pct: number;
}

export interface ComplianceContext {
  qualiopi_confirmed: boolean;
  cpf_eligible: boolean;
  deadline_risk: boolean;
  missing_mandatory_fields: string[];
  blocking_reason?: string | null;
}

export interface PipelineContext {
  status: PipelineStatus;
  priority: 'basse' | 'moyenne' | 'haute' | 'critique';
  next_action?: {
    type: string;
    label: string;
    due_at: string;
  };
}

export interface DossierContext {
  metadata: DossierMetadata;
  pedagogy: PedagogyContext;
  administration: AdministrationContext;
  finances: FinancesContext;
  documents: DocumentsContext;
  compliance: ComplianceContext;
  pipeline: PipelineContext;
}
