// ============================================
// API Route — Cron de scraping
// ============================================
// Endpoint déclenché toutes les 6h par Vercel Cron Jobs
// (configuré dans vercel.json).
//
// Sécurité : on vérifie l'en-tête `Authorization: Bearer <CRON_SECRET>`
// pour empêcher quelqu'un de déclencher le scraping manuellement.

import { NextResponse } from 'next/server';

import { persistScrapedTournaments } from '@/lib/persist';
import { scrapeAllTournaments } from '@/lib/scraper';
import { createAdminClient } from '@/lib/supabase';

// On force l'exécution en runtime Node.js (cheerio nécessite Node, pas Edge)
export const runtime = 'nodejs';

// Timeout long car le scraping + géocodage prend du temps
// (10 pages * 1.5s scrape + ~30 nouveaux clubs * 250ms géocodage = ~25s).
// Cap à 60s pour rester dans la limite gratuite Vercel.
export const maxDuration = 60;

export async function GET(request: Request) {
  // Vérification du token cron — empêche les déclenchements externes
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[cron] Démarrage du scraping...');

    // 1. Scrape les pages Padel Magazine
    const scrapeResult = await scrapeAllTournaments(10);

    if (scrapeResult.tournaments.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucun tournoi extrait',
        errors: scrapeResult.errors,
      });
    }

    // 2. Persistance + géocodage des nouveaux clubs (cf. lib/persist.ts)
    const supabase = createAdminClient();
    const persistResult = await persistScrapedTournaments(scrapeResult, supabase);

    console.log(
      `[cron] Succès : ${persistResult.clubsUpserted} clubs (${persistResult.geocoded} géocodés), ${persistResult.tournamentsUpserted} tournois`
    );

    return NextResponse.json({
      success: true,
      stats: {
        pages_scraped: scrapeResult.pagesScraped,
        clubs: persistResult.clubsUpserted,
        geocoded: persistResult.geocoded,
        tournaments: persistResult.tournamentsUpserted,
        scrape_errors: scrapeResult.errors.length,
        persist_errors: persistResult.errors.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[cron] Exception:', message);
    return NextResponse.json(
      { error: 'Erreur serveur', details: message },
      { status: 500 }
    );
  }
}
