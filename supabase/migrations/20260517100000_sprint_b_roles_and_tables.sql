-- Migration Sprint B: Ajout des rôles et de la table lead_events

-- 1. Ajout sécurisé des valeurs à l'énumération public.app_role
ALTER TYPE public.app_role ADD VALUE 'gestionnaire';
ALTER TYPE public.app_role ADD VALUE 'partenaire';
ALTER TYPE public.app_role ADD VALUE 'inscrit';

-- 2. Création de la table lead_events pour l'historique de traitement
CREATE TABLE IF NOT EXISTS public.lead_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  event_name   VARCHAR(100) NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer la recherche par lead_id
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON public.lead_events(created_at DESC);

-- 3. Activation de la sécurité au niveau des lignes (RLS) sur lead_events
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "user_roles select all auth" ON public.lead_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_roles insert all auth" ON public.lead_events
  FOR INSERT TO authenticated WITH CHECK (true);
