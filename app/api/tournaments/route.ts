// ============================================
// API Route — Liste des tournois
// ============================================
// Endpoint utilisé par la page d'accueil pour récupérer les tournois.
// Filtrable par catégorie, genre, date, et distance depuis Cagny.

import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase';
import { distanceFromAmiens } from '@/lib/geo';

export const runtime = 'nodejs';

// Cache 5 minutes côté serveur — les tournois ne changent pas en temps réel
export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Paramètres de filtrage
  const category = url.searchParams.get('category');         // ex: P25
  const gender = url.searchParams.get('gender');             // ex: messieurs
  const maxDistanceKm = url.searchParams.get('maxDistanceKm'); // ex: 50

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('upcoming_tournaments')
      .select('*')
      .order('start_date', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }
    if (gender) {
      query = query.eq('gender', gender);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[api/tournaments] Erreur DB:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération' },
        { status: 500 }
      );
    }

    // Filtrage post-DB par distance (la DB ne fait pas de calcul géo simple)
    let filtered = data ?? [];
    if (maxDistanceKm) {
      const max = parseInt(maxDistanceKm, 10);
      filtered = filtered.filter((t) => {
        const dist = distanceFromAmiens(t.club_lat, t.club_lng);
        // Si on n'a pas les coords, on garde le tournoi (mieux vaut afficher trop que pas assez)
        return dist === null || dist <= max;
      });
    }

    // On enrichit chaque tournoi avec sa distance pour l'affichage
    const enriched = filtered.map((t) => ({
      ...t,
      distance_km: distanceFromAmiens(t.club_lat, t.club_lng),
    }));

    return NextResponse.json({
      tournaments: enriched,
      count: enriched.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur serveur', details: message },
      { status: 500 }
    );
  }
}
