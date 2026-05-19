-- Migration : Création de la table dossiers (Hub Predict)

-- 1. Création de la table principale
CREATE TABLE IF NOT EXISTS public.dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_ref TEXT UNIQUE, -- Lien vers la tentative de test d'origine
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    
    -- Colonnes natives pour filtres rapides
    status TEXT NOT NULL DEFAULT 'nouveau',
    priority TEXT NOT NULL DEFAULT 'moyenne',
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Le pivot JSON complet (V2)
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexation pour les performances
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON public.dossiers(status);
CREATE INDEX IF NOT EXISTS idx_dossiers_assigned_to ON public.dossiers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_dossiers_context_gin ON public.dossiers USING GIN (context);

-- 3. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dossiers_updated_at
    BEFORE UPDATE ON public.dossiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Sécurité (RLS)
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

-- Politique : Les conseillers et admins voient tout le hub
CREATE POLICY "Conseillers et admins peuvent tout voir"
    ON public.dossiers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Conseillers et admins peuvent modifier"
    ON public.dossiers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Commentaires techniques
COMMENT ON TABLE public.dossiers IS 'Table pivot centralisant les dossiers Bilan & Predict';
COMMENT ON COLUMN public.dossiers.context IS 'Objet DossierContext V2 complet stocké en JSONB';
