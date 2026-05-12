// ============================================
// Page liste complète des tournois — /tournois
// ============================================
// Auparavant cette liste était sur la home (/). On l'a extraite ici pour
// que la home redevienne une landing page synthétique avec des previews,
// et que les utilisateurs qui veulent vraiment scanner les 99 tournois
// aient une page dédiée avec tous les filtres.

import type { Metadata } from 'next';
import { Trophy } from 'lucide-react';

import { Header } from '@/components/header';
import { TournamentList } from '@/components/tournament-list';
import { createAdminClient } from '@/lib/supabase';
import { distanceFromAmiens } from '@/lib/geo';
import type { TournamentWithClub } from '@/types/tournament';

// Revalidation toutes les 5 minutes : cohérent avec le rythme de scrape
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Tous les tournois padel — Calendrier FFT',
  description:
    'Calendrier complet des tournois homologués FFT (P25 à P2000) dans les Hauts-de-France. Filtré par catégorie, genre, distance, période et créneau.',
  alternates: { canonical: '/tournois' },
};

async function getTournaments(): Promise<(TournamentWithClub & { distance_km: number | null })[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('upcoming_tournaments')
    .select('*')
    .order('start_date', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[tournois] erreur:', error);
    return [];
  }
  return (data ?? []).map((t) => ({
    ...t,
    distance_km: distanceFromAmiens(t.club_lat, t.club_lng),
  }));
}

export default async function TournoisPage() {
  const tournaments = await getTournaments();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* Hero court de la page tournois — focus sur le contenu, pas de
          gros visuel comme la home */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-emerald-600" aria-hidden />
            Tous les tournois
          </h1>
          <p className="text-base text-muted-foreground">
            {tournaments.length} tournois homologués FFT à venir dans la région
            Hauts-de-France. Utilise les filtres pour trouver le tien.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <TournamentList tournaments={tournaments} />
      </section>
    </div>
  );
}
