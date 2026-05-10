// ============================================
// Page d'accueil — Liste des tournois
// ============================================
// Server component qui fetch les tournois côté serveur (SEO + perf).
// Les filtres interactifs sont délégués à <FilterPanel /> en client component.

import Link from 'next/link';
import { MapPin, Trophy, Calendar } from 'lucide-react';

import { TournamentList } from '@/components/tournament-list';
import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';
import { distanceFromAmiens } from '@/lib/geo';
import type { TournamentWithClub } from '@/types/tournament';

// Revalidation toutes les 5 minutes (les tournois changent rarement)
export const revalidate = 300;

async function getTournaments(): Promise<(TournamentWithClub & { distance_km: number | null })[]> {
  // On utilise le client admin côté server component
  // (lecture publique aussi possible avec anon key, mais admin évite les surprises de RLS)
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('upcoming_tournaments')
    .select('*')
    .order('start_date', { ascending: true })
    .limit(100);

  if (error) {
    console.error('[page] Erreur fetch tournois:', error);
    return [];
  }

  // Enrichissement avec la distance depuis Cagny
  return (data ?? []).map((t) => ({
    ...t,
    distance_km: distanceFromAmiens(t.club_lat, t.club_lng),
  }));
}

export default async function HomePage() {
  const tournaments = await getTournaments();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* Hero section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
            <Trophy className="w-4 h-4" />
            Tournois homologués FFT
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Tous les tournois padel
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              autour d&apos;Amiens
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Le calendrier complet des P25, P50, P100 et plus dans la Somme et les Hauts-de-France.
            Filtré par catégorie, genre et distance depuis Cagny.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {tournaments.length} tournois à venir
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Centré sur Amiens Padel (Cagny)
            </div>
          </div>
        </div>
      </section>

      {/* Liste des tournois (composant client pour les filtres interactifs) */}
      <section className="container mx-auto px-4 pb-20">
        <TournamentList tournaments={tournaments} />
      </section>

      {/* Footer minimal */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          Padel Amiens — Données publiques agrégées depuis{' '}
          <a
            href="https://tournois.padelmagazine.fr/ligues/hauts-de-france"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Padel Magazine
          </a>
        </p>
        <p className="mt-2">
          Pas affilié à la FFT. Pour s&apos;inscrire, passer par{' '}
          <a
            href="https://tenup.fft.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Ten&apos;Up
          </a>
          .
        </p>
        <p className="mt-4">
          <Link href="/mentions-legales" className="underline hover:text-foreground">
            Mentions légales
          </Link>
        </p>
      </footer>
    </div>
  );
}
