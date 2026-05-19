-- Migration Sprint D: Ajout de la colonne appointment_date sur la table leads

-- 1. Ajout de la colonne appointment_date si elle n'existe pas
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP WITH TIME ZONE;

-- 2. Indexation pour faciliter les requêtes d'urgence et de tri
CREATE INDEX IF NOT EXISTS idx_leads_appointment_date ON public.leads(appointment_date);

-- 3. Ajout de commentaires d'explication
COMMENT ON COLUMN public.leads.appointment_date IS 'Date de rendez-vous en préfecture du candidat pour le calcul de l''urgence partenaire';
