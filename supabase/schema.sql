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
