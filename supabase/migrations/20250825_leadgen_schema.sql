-- Lead Generation & LP/Form/Tracking Schema - Compatible avec schéma CRM existant
-- Safe to run multiple times (IF NOT EXISTS) and does not drop existing objects.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table commerciaux si elle n'existe pas (pour les références)
CREATE TABLE IF NOT EXISTS public.commerciaux (
  id integer NOT NULL DEFAULT nextval('commerciaux_id_seq'::regclass),
  nom text NOT NULL,
  first_name text,
  last_name text,
  email text UNIQUE,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT commerciaux_pkey PRIMARY KEY (id)
);

-- Table pour les leads générés via LP/Form (séparée de contacts CRM existants)
-- Les leads peuvent devenir des projets dans le CRM existant
CREATE TABLE IF NOT EXISTS public.leads (
  id bigserial PRIMARY KEY,
  email text,
  phone text,
  first_name text,
  last_name text,
  dob date,
  zipcode text,
  city text,
  country text,
  tags text[] DEFAULT '{}',
  source text DEFAULT 'landing_page',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ad_id text,
  adset_id text,
  campaign_id text,
  score integer DEFAULT 0,
  status text DEFAULT 'new',
  assigned_to integer REFERENCES public.commerciaux(id) ON DELETE SET NULL,
  -- Lien vers le CRM existant
  contact_id bigint REFERENCES public.contact(identifiant) ON DELETE SET NULL,
  projet_id bigint REFERENCES public.projets(projet_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Consents journal (pour leads et contacts CRM)
CREATE TABLE IF NOT EXISTS public.consents (
  id bigserial PRIMARY KEY,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contact(identifiant) ON DELETE SET NULL,
  purpose text NOT NULL,
  channel text NOT NULL,
  text text NOT NULL,
  lawful_basis text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  ip inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Campaigns (ads/email) - étend les campagnes_email existantes
CREATE TABLE IF NOT EXISTS public.campaigns_ads (
  id bigserial PRIMARY KEY,
  name text,
  source text,
  medium text,
  platform text,
  objective text,
  budget numeric,
  start_at timestamptz,
  end_at timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Landing pages
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id bigserial PRIMARY KEY,
  slug text UNIQUE,
  template text,
  title text,
  settings jsonb DEFAULT '{}',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Forms
CREATE TABLE IF NOT EXISTS public.forms (
  id bigserial PRIMARY KEY,
  page_id bigint REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  name text,
  schema jsonb NOT NULL DEFAULT '{}',
  version text,
  created_at timestamptz DEFAULT now()
);

-- Form submissions - peuvent créer des projets dans le CRM existant
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id bigserial PRIMARY KEY,
  form_id bigint REFERENCES public.forms(id) ON DELETE SET NULL,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contact(identifiant) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'submitted',
  utm jsonb DEFAULT '{}',
  jwt_claims jsonb,
  -- Lien vers le CRM existant
  projet_id bigint REFERENCES public.projets(projet_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Event stream - peut tracker les interactions avec projets et contrats existants
CREATE TABLE IF NOT EXISTS public.events (
  id bigserial PRIMARY KEY,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contact(identifiant) ON DELETE SET NULL,
  name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}',
  page_id bigint REFERENCES public.landing_pages(id) ON DELETE SET NULL,
  campaign_id bigint REFERENCES public.campaigns_ads(id) ON DELETE SET NULL,
  event_id text UNIQUE,
  source text,
  -- Liens vers le CRM existant
  projet_id bigint REFERENCES public.projets(projet_id) ON DELETE SET NULL,
  contrat_id uuid REFERENCES public.contrats(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Email tracking (normalized) - étend envois_email existants
CREATE TABLE IF NOT EXISTS public.emails_leads (
  id bigserial PRIMARY KEY,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contact(identifiant) ON DELETE SET NULL,
  template text,
  subject text,
  status text,
  provider_id text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  spam_complaint_at timestamptz,
  -- Lien vers le CRM existant
  projet_id bigint REFERENCES public.projets(projet_id) ON DELETE SET NULL,
  contrat_id uuid REFERENCES public.contrats(id) ON DELETE SET NULL
);

-- SMS tracking
CREATE TABLE IF NOT EXISTS public.sms (
  id bigserial PRIMARY KEY,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contact(identifiant) ON DELETE SET NULL,
  template text,
  status text,
  provider_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  clicked_at timestamptz,
  -- Lien vers le CRM existant
  projet_id bigint REFERENCES public.projets(projet_id) ON DELETE SET NULL,
  contrat_id uuid REFERENCES public.contrats(id) ON DELETE SET NULL
);

-- Calls - étend interactions existants
CREATE TABLE IF NOT EXISTS public.calls_leads (
  id bigserial PRIMARY KEY,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contact(identifiant) ON DELETE SET NULL,
  outcome text,
  duration_sec integer,
  agent_id integer REFERENCES public.commerciaux(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  ended_at timestamptz,
  notes text,
  -- Lien vers le CRM existant
  projet_id bigint REFERENCES public.projets(projet_id) ON DELETE SET NULL,
  contrat_id uuid REFERENCES public.contrats(id) ON DELETE SET NULL
);

-- Ad costs
CREATE TABLE IF NOT EXISTS public.ad_costs (
  id bigserial PRIMARY KEY,
  campaign_id bigint REFERENCES public.campaigns_ads(id) ON DELETE CASCADE,
  date date NOT NULL,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  spend numeric DEFAULT 0,
  cpc numeric,
  cpm numeric,
  cpl numeric
);

-- Segments pour leads - étend segments existants
CREATE TABLE IF NOT EXISTS public.segments_leads (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  filter jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_events_event_id ON public.events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_time ON public.form_submissions(form_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ad_costs_campaign_date ON public.ad_costs(campaign_id, date);

-- Trigram indexes for fuzzy search if pg_trgm available
DO $$ BEGIN
  IF to_regprocedure('pg_trgm') IS NOT NULL THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_trgm';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_email_trgm ON public.leads USING gin (email gin_trgm_ops)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm ON public.leads USING gin (phone gin_trgm_ops)';
  END IF;
END $$;

-- RLS stubs (disabled by default; enable per-tenant later if needed)
-- ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY contacts_read_own ON public.contacts FOR SELECT USING (true);

-- Données de test pour les commerciaux
INSERT INTO public.commerciaux (nom, first_name, last_name, email, phone) VALUES
  ('Commercial Principal', 'Jean', 'Dupont', 'jean.dupont@premunia.com', '0123456789'),
  ('Commercial Senior', 'Marie', 'Martin', 'marie.martin@premunia.com', '0123456790')
ON CONFLICT (email) DO NOTHING;

-- Fonctions d'intégration avec le CRM existant

-- Fonction pour convertir un lead en contact CRM
CREATE OR REPLACE FUNCTION convert_lead_to_contact(p_lead_id bigint)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_lead_record RECORD;
  v_contact_id bigint;
BEGIN
  -- Récupérer les données du lead
  SELECT * INTO v_lead_record FROM public.leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead non trouvé: %', p_lead_id;
  END IF;
  
  -- Créer ou mettre à jour le contact dans le CRM existant
  INSERT INTO public.contact (
    identifiant,
    civilite,
    prenom,
    nom,
    email,
    telephone,
    code_postal,
    ville,
    created_at,
    updated_at
  ) VALUES (
    nextval('contact_identifiant_seq'),
    CASE 
      WHEN v_lead_record.first_name LIKE 'M.%' THEN 'M.'
      WHEN v_lead_record.first_name LIKE 'Mme%' THEN 'Mme'
      ELSE 'M.'
    END,
    v_lead_record.first_name,
    v_lead_record.last_name,
    v_lead_record.email,
    v_lead_record.phone,
    v_lead_record.zipcode,
    v_lead_record.city,
    now(),
    now()
  )
  RETURNING identifiant INTO v_contact_id;
  
  -- Mettre à jour le lead avec l'ID du contact
  UPDATE public.leads SET contact_id = v_contact_id WHERE id = p_lead_id;
  
  RETURN v_contact_id;
END;
$$;

-- Fonction pour créer un projet à partir d'un lead
CREATE OR REPLACE FUNCTION create_project_from_lead(
  p_lead_id bigint,
  p_type_projet text DEFAULT 'assurance_personnes'
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_lead_record RECORD;
  v_contact_id bigint;
  v_projet_id bigint;
BEGIN
  -- Récupérer les données du lead
  SELECT * INTO v_lead_record FROM public.leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead non trouvé: %', p_lead_id;
  END IF;
  
  -- S'assurer que le contact existe
  IF v_lead_record.contact_id IS NULL THEN
    v_contact_id := convert_lead_to_contact(p_lead_id);
  ELSE
    v_contact_id := v_lead_record.contact_id;
  END IF;
  
  -- Créer le projet dans la table projets existante
  INSERT INTO public.projets (
    projet_id,
    contact_id,
    date_creation,
    origine,
    statut,
    commercial,
    created_at,
    updated_at
  ) VALUES (
    nextval('projets_projet_id_seq'),
    v_contact_id,
    now(),
    v_lead_record.source,
    'nouveau',
    'Système',
    now(),
    now()
  )
  RETURNING projet_id INTO v_projet_id;
  
  -- Mettre à jour le lead avec l'ID du projet
  UPDATE public.leads SET projet_id = v_projet_id WHERE id = p_lead_id;
  
  RETURN v_projet_id;
END;
$$;


