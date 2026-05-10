// ============================================
// Script de scraping local
// ============================================
// Lance le scraping une fois en local et affiche les résultats.
// Utilisé pour :
//   - Premier remplissage de la DB
//   - Debug du parser
//   - Validation manuelle des données extraites
//
// Utilisation : npm run scrape

import 'dotenv/config';

import { persistScrapedTournaments } from '../lib/persist';
import { scrapeAllTournaments } from '../lib/scraper';
import { createAdminClient } from '../lib/supabase';

// Couleurs ANSI pour des logs lisibles
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';

async function main() {
  console.log(`${BOLD}${BLUE}🎾 Padel Amiens — Scraping local${RESET}\n`);

  // ============================================
  // Étape 1 : Scraping
  // ============================================
  console.log(`${YELLOW}→ Lancement du scraping (10 pages max)...${RESET}`);
  const start = Date.now();

  const result = await scrapeAllTournaments(10);
  const duration = ((Date.now() - start) / 1000).toFixed(1);

  console.log(
    `\n${GREEN}✓${RESET} Scraping terminé en ${duration}s : ${result.tournaments.length} tournois sur ${result.pagesScraped} pages`
  );

  if (result.errors.length > 0) {
    console.log(`\n${YELLOW}⚠ ${result.errors.length} erreurs rencontrées :${RESET}`);
    result.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
    if (result.errors.length > 5) {
      console.log(`  ... et ${result.errors.length - 5} autres`);
    }
  }

  // Aperçu des 3 premiers tournois pour validation manuelle
  console.log(`\n${BOLD}Aperçu des 3 premiers tournois :${RESET}`);
  result.tournaments.slice(0, 3).forEach((t, i) => {
    console.log(`\n${i + 1}. ${BOLD}${t.title}${RESET} (${t.category} ${t.gender})`);
    console.log(`   📅 ${t.start_date}`);
    console.log(`   🏟  ${t.club.name}`);
    if (t.club.city) console.log(`   📍 ${t.club.city} (${t.club.postal_code ?? '?'})`);
    if (t.club.contact_email) console.log(`   📧 ${t.club.contact_email}`);
    if (t.club.contact_phone) console.log(`   📞 ${t.club.contact_phone}`);
    if (t.referee) console.log(`   ⚖  JA : ${t.referee}`);
  });

  // ============================================
  // Étape 2 : Insertion en base (si Supabase configuré)
  // ============================================
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      `\n${YELLOW}⚠ Variables Supabase manquantes — données NON insérées en DB.${RESET}`
    );
    console.log(`  Renseigne .env.local et relance pour persister les données.\n`);
    process.exit(0);
  }

  console.log(`\n${YELLOW}→ Insertion en DB (avec géocodage des nouveaux clubs)...${RESET}`);
  const supabase = createAdminClient();

  try {
    const persistResult = await persistScrapedTournaments(result, supabase);

    console.log(
      `${GREEN}✓${RESET} ${persistResult.clubsUpserted} clubs upsertés (${persistResult.geocoded} géocodés cette fois)`
    );
    console.log(
      `${GREEN}✓${RESET} ${persistResult.tournamentsUpserted} tournois upsertés`
    );

    if (persistResult.errors.length > 0) {
      console.log(`\n${YELLOW}⚠ ${persistResult.errors.length} avertissements géocodage :${RESET}`);
      persistResult.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
      if (persistResult.errors.length > 5) {
        console.log(`  ... et ${persistResult.errors.length - 5} autres`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erreur inconnue';
    console.error(`${RED}✗ Échec de la persistance :${RESET}`, message);
    process.exit(1);
  }

  console.log(`\n${BOLD}${GREEN}✅ Scraping terminé avec succès !${RESET}\n`);
}

main().catch((error) => {
  console.error(`${RED}${BOLD}✗ Erreur fatale :${RESET}`, error);
  process.exit(1);
});
