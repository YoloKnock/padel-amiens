-- ============================================
-- Schéma Supabase pour Padel Amiens
-- ============================================
-- À exécuter dans Supabase Studio (SQL Editor) lors de la création du projet.
-- Recopie tout ce fichier dans une nouvelle requête et clique sur "Run".

-- ============================================
-- Table: clubs
-- Contient les clubs/centres padel référencés
-- ============================================
CREATE TABLE IF NOT EXISTS clubs (
  -- Identifiant unique du club (slug normalisé depuis le nom)
  id TEXT PRIMARY KEY,

  -- Nom affiché du club
  name TEXT NOT NULL,

  -- Adresse complète
  address TEXT,

  -- Ville
  city TEXT,

  -- Code postal (utilisé pour le filtrage par département)
  postal_code TEXT,

  -- Coordonnées GPS pour le calcul de distance
  -- (NULL si on ne les a pas encore récupérées via géocodage)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Email de contact du club
  contact_email TEXT,

  -- Téléphone de contact
  contact_phone TEXT,

  -- Date de création/mise à jour pour audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par code postal (filtre département)
CREATE INDEX IF NOT EXISTS idx_clubs_postal_code ON clubs(postal_code);

-- ============================================
-- Table: tournaments
-- Contient les tournois homologués FFT
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
  -- Identifiant unique généré (UUID)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence vers le club organisateur
  club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE,

  -- Catégorie : P25, P50, P100, P250, P500, P1000, P1500, P2000
  category TEXT NOT NULL,

  -- Genre : 'messieurs', 'dames', 'mixte'
  gender TEXT NOT NULL,

  -- Titre brut du tournoi (ex: "P100 Hommes en journée")
  title TEXT NOT NULL,

  -- Date de début du tournoi
  start_date DATE NOT NULL,

  -- Date de fin (= start_date pour les tournois 1 jour)
  end_date DATE,

  -- Juge-arbitre du tournoi
  referee TEXT,

  -- URL d'inscription Ten'Up si dispo
  registration_url TEXT,

  -- Source de la donnée pour traçabilité
  source TEXT NOT NULL DEFAULT 'padelmagazine',

  -- Hash unique pour éviter les doublons lors du scraping
  -- (basé sur club_id + start_date + category + gender)
  fingerprint TEXT UNIQUE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les filtres les plus fréquents
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_category ON tournaments(category);
CREATE INDEX IF NOT EXISTS idx_tournaments_gender ON tournaments(gender);
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON tournaments(club_id);

-- ============================================
-- Trigger: mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- On active la RLS sur les deux tables.
-- Lecture publique pour tous (anon).
-- Écriture uniquement via le service_role (utilisé par le scraper côté serveur).

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Politique: lecture publique des clubs
DROP POLICY IF EXISTS "Lecture publique des clubs" ON clubs;
CREATE POLICY "Lecture publique des clubs"
  ON clubs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique: lecture publique des tournois
DROP POLICY IF EXISTS "Lecture publique des tournois" ON tournaments;
CREATE POLICY "Lecture publique des tournois"
  ON tournaments FOR SELECT
  TO anon, authenticated
  USING (true);

-- Le service_role bypass automatiquement la RLS, donc le scraper
-- pourra insérer/mettre à jour sans politique supplémentaire.

-- ============================================
-- Vue utile: tournois à venir avec infos club
-- ============================================
CREATE OR REPLACE VIEW upcoming_tournaments AS
SELECT
  t.id,
  t.category,
  t.gender,
  t.title,
  t.start_date,
  t.end_date,
  t.referee,
  t.registration_url,
  c.id AS club_id,
  c.name AS club_name,
  c.city AS club_city,
  c.postal_code AS club_postal_code,
  c.latitude AS club_lat,
  c.longitude AS club_lng,
  c.contact_email AS club_email,
  c.contact_phone AS club_phone
FROM tournaments t
LEFT JOIN clubs c ON t.club_id = c.id
WHERE t.start_date >= CURRENT_DATE
ORDER BY t.start_date ASC;

-- ============================================
-- Brique 2 — Événements non-homologués
-- ============================================
-- Table dédiée aux events qui ne passent pas par la FFT :
--   - Tournois Americano (format libre, pas de classement)
--   - Journées portes ouvertes
--   - Initiations / découverte padel
--   - Stages, exhibitions, etc.
--
-- Ces events seront saisis manuellement via un mini back-office (à venir).
-- On ne scrape RIEN d'illégal (Instagram, etc.) — uniquement de la saisie
-- volontaire par les organisateurs ou par nous depuis des sources publiques.

CREATE TABLE IF NOT EXISTS events (
  -- Identifiant unique généré (UUID)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type d'événement (libre mais on contraint à un set connu)
  -- CHECK pour éviter les fautes de frappe à la saisie
  event_type TEXT NOT NULL CHECK (
    event_type IN ('americano', 'portes_ouvertes', 'initiation', 'stage', 'autre')
  ),

  -- Référence vers le club organisateur (réutilise la table clubs existante)
  club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE,

  -- Titre de l'événement (ex: "Americano du dimanche matin")
  title TEXT NOT NULL,

  -- Description libre — détails sur le format, tarif, niveau requis, etc.
  description TEXT,

  -- Niveau visé (libre : "tous niveaux", "débutants", "P25+", etc.)
  level TEXT,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Horaires éventuels (texte libre pour rester souple : "9h-12h", "soirée")
  schedule TEXT,

  -- Tarif éventuel (texte libre : "10€", "gratuit", "15€ par paire")
  price TEXT,

  -- URL d'inscription (site du club, Doodle, Helloasso, etc.)
  registration_url TEXT,

  -- Email/téléphone de contact pour cet event spécifique (si différent du club)
  contact_email TEXT,
  contact_phone TEXT,

  -- Qui a saisi l'event (admin user ID Supabase, ou NULL si saisie pré-auth)
  -- Sera utile pour l'audit + le "vos events" dans le back-office
  created_by UUID,

  -- Statut de modération — on n'expose au public que les events 'published'
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'archived')
  ),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les filtres les plus fréquents
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);

-- Trigger updated_at (réutilise la fonction définie plus haut pour clubs/tournaments)
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS sur events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Lecture publique : uniquement les events 'published'
-- Les drafts et archives restent invisibles aux visiteurs anonymes
DROP POLICY IF EXISTS "Lecture publique des events publies" ON events;
CREATE POLICY "Lecture publique des events publies"
  ON events FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Écriture : uniquement via le service_role (back-office admin).
-- Le service_role bypass la RLS automatiquement, pas besoin de policy explicite.

-- Vue : events à venir publiés, joints au club organisateur
CREATE OR REPLACE VIEW upcoming_events AS
SELECT
  e.id,
  e.event_type,
  e.title,
  e.description,
  e.level,
  e.start_date,
  e.end_date,
  e.schedule,
  e.price,
  e.registration_url,
  e.contact_email AS event_contact_email,
  e.contact_phone AS event_contact_phone,
  c.id AS club_id,
  c.name AS club_name,
  c.city AS club_city,
  c.postal_code AS club_postal_code,
  c.latitude AS club_lat,
  c.longitude AS club_lng
FROM events e
LEFT JOIN clubs c ON e.club_id = c.id
WHERE e.status = 'published'
  AND e.start_date >= CURRENT_DATE
ORDER BY e.start_date ASC;
