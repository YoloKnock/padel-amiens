// ============================================
// Scraper Padel Magazine — ligue Hauts-de-France
// ============================================
// Parse les pages publiques de tournois.padelmagazine.fr et extrait les
// tournois homologués FFT. Validation Zod + upsert dans Supabase.
//
// Pourquoi cheerio plutôt qu'un headless browser (Playwright/Puppeteer) ?
// → Padel Magazine sert le HTML en SSR (pas de JS rendering nécessaire).
//   cheerio est ~100x plus léger et plus rapide. Si un jour le site passe
//   en SPA, on pivotera vers Playwright.

import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

import {
  PADEL_MAGAZINE_BASE_URL,
  SCRAPER_DELAY_MS,
  SCRAPER_USER_AGENT,
} from './constants';
import { slugify } from './utils';
import { CATEGORIES, GENDERS, type Category, type Gender } from '@/types/tournament';

// ============================================
// Types internes au scraper
// ============================================

export interface ScrapedTournament {
  category: Category;
  gender: Gender;
  title: string;
  start_date: string; // ISO YYYY-MM-DD
  referee: string | null;
  // URL de la fiche du tournoi sur Padel Magazine — sert de "registration_url"
  // côté DB (clic utilisateur → page tournoi → bouton Ten'Up officiel)
  detail_url: string | null;
  club: ScrapedClub;
}

export interface ScrapedClub {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface ScrapeResult {
  tournaments: ScrapedTournament[];
  errors: string[];
  pagesScraped: number;
}

// ============================================
// Helpers de parsing
// ============================================

/**
 * Convertit une date française "10 mai 2026" en ISO "2026-05-10".
 * Retourne null si le format n'est pas reconnu.
 */
const MONTHS_FR: Record<string, string> = {
  janvier: '01', février: '02', fevrier: '02', mars: '03', avril: '04',
  mai: '05', juin: '06', juillet: '07', août: '08', aout: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12', decembre: '12',
};

export function parseFrenchDate(text: string): string | null {
  // Match "10 mai 2026" ou "1er janvier 2026"
  const match = text.match(/(\d{1,2})(?:er)?\s+([a-zéûôîàç]+)\s+(\d{4})/i);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const monthName = match[2].toLowerCase();
  const year = match[3];

  const month = MONTHS_FR[monthName];
  if (!month) return null;

  return `${year}-${month}-${day}`;
}

/**
 * Détecte la catégorie depuis un titre brut.
 * "P 100 DAME" → P100, "P50 JOURNÉE" → P50, "P500 Femmes" → P500.
 *
 * Important : on matche les catégories les plus longues d'abord pour éviter
 * que "P50" soit reconnu dans "P500" (bug d'ordre du tri alphabétique).
 */
const CATEGORIES_BY_LENGTH = [...CATEGORIES].sort((a, b) => b.length - a.length);

export function parseCategory(title: string): Category | null {
  const upper = title.toUpperCase().replace(/\s+/g, '');
  for (const cat of CATEGORIES_BY_LENGTH) {
    if (upper.includes(cat)) return cat;
  }
  return null;
}

/**
 * Détecte le genre depuis un titre brut.
 *
 * Règles (par ordre de priorité) :
 *   1. "Mixte" → mixte
 *   2. Titre commence par "Messieurs/Hommes" → messieurs (même si "ouvert aux dames" suit)
 *   3. Titre commence par "Dames/Femmes" → dames
 *   4. Présence de "Dame/Femme" ailleurs → dames
 *   5. Par défaut → messieurs
 *
 * Le point 2 vient corriger les titres "P100 Messieurs ouvert aux Dames" qui
 * étaient à tort classés en dames.
 */
export function parseGender(title: string): Gender {
  const upper = title.toUpperCase();

  if (upper.includes('MIXTE')) return 'mixte';

  // Match en tête de titre, éventuellement après "P<chiffres>"
  if (/^(P\s*\d+\s+)?(MESSIEURS|HOMMES|MASCULIN)/i.test(title)) return 'messieurs';
  if (/^(P\s*\d+\s+)?(DAMES?|FEMMES?|FEMININ)/i.test(title)) return 'dames';

  // Fallback : si on voit Dame/Femme ailleurs dans le titre
  if (upper.includes('DAME') || upper.includes('FEMME') || upper.includes('FEMININ')) {
    return 'dames';
  }

  return 'messieurs';
}

/**
 * Extrait le code postal d'une chaîne d'adresse.
 * "1 chemin du Grand Riez, 80330 CAGNY" → "80330"
 */
export function extractPostalCode(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

/**
 * Nettoie un nom de ville extrait du texte parasite (sauts de ligne, doubles
 * espaces, mots-clés comme "Plus de détails"). On garde uniquement la première
 * "ligne logique" en s'arrêtant au premier marqueur de bruit.
 */
export function cleanCity(raw: string): string | null {
  if (!raw) return null;
  // On coupe uniquement sur des retours ligne ou 3+ espaces consécutifs
  // (les noms composés style "Noyelles sur selle" ont des doubles espaces
  // dans la source, qu'on veut préserver après normalisation).
  const cleaned = raw
    .split(/\s{3,}|\n|\r/)[0]
    .replace(/\s+/g, ' ') // normalise les espaces multiples en simple
    .trim();
  return cleaned.length > 0 && cleaned.length < 80 ? cleaned : null;
}

/**
 * Normalise une URL extraite du HTML (potentiellement relative) en absolue.
 * Utilise PADEL_MAGAZINE_BASE_URL comme base. Retourne null si invalide.
 */
function normalizeUrl(href: string): string | null {
  try {
    return new URL(href, PADEL_MAGAZINE_BASE_URL).toString();
  } catch {
    return null;
  }
}

/**
 * Génère un fingerprint unique pour un tournoi (anti-doublon).
 * Basé sur : club + date + catégorie + genre.
 */
export function generateFingerprint(
  clubId: string,
  date: string,
  category: string,
  gender: string
): string {
  const input = `${clubId}|${date}|${category}|${gender}`;
  return createHash('md5').update(input).digest('hex');
}

// ============================================
// Fetch d'une page Padel Magazine
// ============================================

async function fetchPage(pageNumber: number): Promise<string> {
  const url = `${PADEL_MAGAZINE_BASE_URL}?page=${pageNumber}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': SCRAPER_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
    // Cache désactivé : on veut toujours la fraîche dose de tournois
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} sur ${url}`);
  }

  return await response.text();
}

// ============================================
// Parsing d'une page HTML
// ============================================

/**
 * Parse le HTML d'une page Padel Magazine et extrait les tournois.
 *
 * Stratégie : on cherche les blocs qui contiennent à la fois une date
 * et un titre de tournoi. La structure HTML peut évoluer, donc on reste
 * souple sur les sélecteurs.
 */
export function parseHtmlPage(html: string): {
  tournaments: ScrapedTournament[];
  errors: string[];
} {
  const $ = cheerio.load(html);
  const tournaments: ScrapedTournament[] = [];
  const errors: string[] = [];

  // On récupère le texte brut de la zone de résultats et on parse par blocs.
  // Pattern de parsing : chaque tournoi commence par une date, suit titre, puis infos club.
  // Les sélecteurs CSS exacts sont à adapter en pair avec Claude Code après inspection.

  // Heuristique : on cherche les éléments qui contiennent une date au format français
  $('h5, h4, h3, [class*="date"]').each((_, el) => {
    const dateText = $(el).text().trim();
    const date = parseFrenchDate(dateText);
    if (!date) return;

    // On essaie de trouver le titre (h4 suivant ou h3)
    const titleEl = $(el).nextAll('h4, h3').first();
    const title = titleEl.text().trim();
    if (!title) return;

    const category = parseCategory(title);
    if (!category) return; // On skip si pas de catégorie reconnue

    const gender = parseGender(title);

    // Récupération du bloc parent qui contient les infos club + contact
    const block = $(el).closest('.tournoi, article, [class*="tournament"], div').first();
    const blockText = block.text();

    // Extraction du club (souvent après "Club" ou dans un lien)
    const clubLink = block.find('a[href*="/clubs/"]').first();
    const clubName = clubLink.text().trim() || extractClubName(blockText);

    // Extraction email
    const emailMatch = blockText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const email = emailMatch ? emailMatch[0] : null;

    // Extraction téléphone (format français)
    const phoneMatch = blockText.match(/0[1-9](?:[\s.-]?\d{2}){4}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/[\s.-]/g, '') : null;

    // Extraction adresse + code postal
    const postalCode = extractPostalCode(blockText);
    // On capture la ville après le code postal, puis on nettoie le texte parasite
    // (Padel Magazine concatène la ville avec "Plus de détails", contacts, etc.).
    const cityMatch = blockText.match(/\d{5}\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]+)/);
    const city = cityMatch ? cleanCity(cityMatch[1]) : null;

    // Extraction juge-arbitre
    const refereeMatch = blockText.match(/[A-Z][a-z]+\s+[A-Z]+(?=\s|$)/);
    const referee = refereeMatch ? refereeMatch[0] : null;

    // Lien vers la fiche détail du tournoi sur Padel Magazine.
    // Sert de redirection vers la page d'inscription (qui renvoie vers Ten'Up).
    const detailHref = block
      .find('a[href*="/tournois/"], a[href*="/tournoi/"]')
      .first()
      .attr('href');
    const detailUrl = detailHref ? normalizeUrl(detailHref) : null;

    if (!clubName) {
      errors.push(`Tournoi sans club identifiable à la date ${date} (titre: "${title}")`);
      return;
    }

    const clubId = slugify(clubName);

    tournaments.push({
      category,
      gender,
      title,
      start_date: date,
      referee,
      detail_url: detailUrl,
      club: {
        id: clubId,
        name: clubName,
        address: null,
        city,
        postal_code: postalCode,
        contact_email: email,
        contact_phone: phone,
      },
    });
  });

  return { tournaments, errors };
}

/**
 * Tente d'extraire un nom de club depuis un bloc de texte.
 * Fallback quand on ne trouve pas de lien.
 */
function extractClubName(text: string): string | null {
  // Pattern : ligne qui contient "Club" suivi du nom
  const match = text.match(/Club\s+([A-Z][^\n,]+?)(?=\s*[,\n]|\s+\d)/);
  return match ? match[1].trim() : null;
}

// ============================================
// Scraping complet : toutes les pages
// ============================================

/**
 * Lance le scraping complet de la ligue Hauts-de-France.
 *
 * @param maxPages — limite le nombre de pages à scraper (défaut: 5).
 *                   En production, on monte à ~37 pages mais on commence petit.
 */
export async function scrapeAllTournaments(maxPages = 5): Promise<ScrapeResult> {
  const allTournaments: ScrapedTournament[] = [];
  const allErrors: string[] = [];
  let pagesScraped = 0;

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`[scraper] Fetch page ${page}...`);
      const html = await fetchPage(page);
      const { tournaments, errors } = parseHtmlPage(html);

      console.log(`[scraper] Page ${page} : ${tournaments.length} tournois extraits, ${errors.length} erreurs`);
      allTournaments.push(...tournaments);
      allErrors.push(...errors.map((e) => `[page ${page}] ${e}`));
      pagesScraped++;

      // Si une page renvoie 0 tournois, on suppose qu'on est au-delà des résultats
      if (tournaments.length === 0 && page > 1) {
        console.log(`[scraper] Page ${page} vide, arrêt.`);
        break;
      }

      // Délai entre deux requêtes pour être poli avec le serveur source
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erreur inconnue';
      allErrors.push(`[page ${page}] ${message}`);
      console.error(`[scraper] Erreur page ${page}:`, message);
    }
  }

  // Déduplication par fingerprint (au cas où un tournoi apparaisse sur 2 pages)
  const seen = new Set<string>();
  const unique = allTournaments.filter((t) => {
    const fp = generateFingerprint(t.club.id, t.start_date, t.category, t.gender);
    if (seen.has(fp)) return false;
    seen.add(fp);
    return true;
  });

  return {
    tournaments: unique,
    errors: allErrors,
    pagesScraped,
  };
}
