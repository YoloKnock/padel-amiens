// ============================================
// Persistance des tournois scrapés en DB
// ============================================
// Cette logique était dupliquée entre la route cron (/api/cron/scrape-tournaments)
// et le script local (scripts/scrape-once.ts). On la centralise ici pour que les
// deux chemins (production vs dev local) partagent le même comportement —
// notamment le géocodage des nouveaux clubs.

import type { SupabaseClient } from '@supabase/supabase-js';

import { geocodeAddress } from './geo';
import { generateFingerprint, type ScrapeResult, type ScrapedClub } from './scraper';

// Délai entre deux appels à l'API gouv pour rester poli
const GEOCODE_DELAY_MS = 250;

export interface PersistResult {
  clubsUpserted: number;
  tournamentsUpserted: number;
  geocoded: number;
  errors: string[];
}

/**
 * Représente un club tel qu'il est inséré en DB : club scrapé + coords éventuelles.
 * Les coords peuvent venir de la DB (club déjà connu) ou d'un géocodage frais.
 */
type ClubForUpsert = ScrapedClub & {
  latitude: number | null;
  longitude: number | null;
};

/**
 * Persiste en base les tournois et clubs scrapés.
 *
 * Stratégie :
 *   1. On dédoublonne les clubs scrapés.
 *   2. On va chercher en DB les coords des clubs déjà connus pour éviter de
 *      re-géocoder à chaque scrape (l'API gouv est gratuite mais on est polis).
 *   3. Pour les clubs sans coords connues, on tente un géocodage via l'API gouv.
 *   4. Upsert clubs (par id) puis upsert tournois (par fingerprint).
 *
 * @param result   Résultat du scraping à persister.
 * @param supabase Client Supabase admin (service_role, bypass RLS).
 */
export async function persistScrapedTournaments(
  result: ScrapeResult,
  supabase: SupabaseClient
): Promise<PersistResult> {
  const errors: string[] = [];

  // 1. Dédoublonnage des clubs scrapés (un même club peut organiser plusieurs tournois)
  const uniqueClubs = new Map<string, ScrapedClub>();
  for (const t of result.tournaments) {
    if (!uniqueClubs.has(t.club.id)) {
      uniqueClubs.set(t.club.id, t.club);
    }
  }

  // 2. Récupération des coords déjà connues en DB pour les clubs scrapés
  const clubIds = Array.from(uniqueClubs.keys());
  const { data: existingClubs } = await supabase
    .from('clubs')
    .select('id, latitude, longitude')
    .in('id', clubIds);

  const existingCoords = new Map<string, { latitude: number | null; longitude: number | null }>(
    (existingClubs ?? []).map((c: { id: string; latitude: number | null; longitude: number | null }) => [
      c.id,
      { latitude: c.latitude, longitude: c.longitude },
    ])
  );

  // 3. Préparation des clubs à upserter — géocodage si nécessaire
  let geocoded = 0;
  const clubsForUpsert: ClubForUpsert[] = [];

  for (const club of uniqueClubs.values()) {
    const existing = existingCoords.get(club.id);

    // Coords déjà connues : on les garde tel quel
    if (existing && existing.latitude !== null && existing.longitude !== null) {
      clubsForUpsert.push({
        ...club,
        latitude: existing.latitude,
        longitude: existing.longitude,
      });
      continue;
    }

    // Sinon on tente le géocodage à partir des bribes d'adresse extraites
    const query = [club.address, club.postal_code, club.city]
      .filter((part): part is string => Boolean(part))
      .join(' ');

    if (!query) {
      // Aucune info géo extraite : on insère le club sans coords
      clubsForUpsert.push({ ...club, latitude: null, longitude: null });
      continue;
    }

    const coords = await geocodeAddress(query);
    if (coords) {
      geocoded++;
      clubsForUpsert.push({
        ...club,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } else {
      errors.push(`Géocodage échoué pour ${club.name} (${query})`);
      clubsForUpsert.push({ ...club, latitude: null, longitude: null });
    }

    // Politesse réseau : on espace les requêtes vers l'API gouv
    await new Promise((resolve) => setTimeout(resolve, GEOCODE_DELAY_MS));
  }

  // 4. Upsert des clubs (FK depuis tournaments → clubs en premier)
  const { error: clubsError } = await supabase
    .from('clubs')
    .upsert(clubsForUpsert, { onConflict: 'id' });

  if (clubsError) {
    throw new Error(`Erreur upsert clubs : ${clubsError.message}`);
  }

  // 5. Upsert des tournois avec leur fingerprint anti-doublon
  const tournamentsToUpsert = result.tournaments.map((t) => ({
    club_id: t.club.id,
    category: t.category,
    gender: t.gender,
    title: t.title,
    start_date: t.start_date,
    end_date: null,
    referee: t.referee,
    registration_url: null,
    source: 'padelmagazine',
    fingerprint: generateFingerprint(t.club.id, t.start_date, t.category, t.gender),
  }));

  const { error: tournamentsError } = await supabase
    .from('tournaments')
    .upsert(tournamentsToUpsert, { onConflict: 'fingerprint' });

  if (tournamentsError) {
    throw new Error(`Erreur upsert tournois : ${tournamentsError.message}`);
  }

  return {
    clubsUpserted: clubsForUpsert.length,
    tournamentsUpserted: tournamentsToUpsert.length,
    geocoded,
    errors,
  };
}
