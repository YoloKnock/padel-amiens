// ============================================
// Page d'accueil — Liste des tournois
// ============================================
// Server component qui fetch les tournois côté serveur (SEO + perf).
// Les filtres interactifs sont délégués à <FilterPanel /> en client component.

import Link from 'next/link';
import { MapPin, Trophy, Calendar, Sparkles, Search } from 'lucide-react';

import { EventCard } from '@/components/event-card';
import { TournamentList } from '@/components/tournament-list';
import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';
import { distanceFromAmiens } from '@/lib/geo';
import type { TournamentWithClub } from '@/types/tournament';
import type { EventWithClub } from '@/types/event';

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

/**
 * Récupère les events non-homologués publiés (Americano, portes ouvertes, etc.)
 * Si la table n'existe pas encore (DB pas migrée), on retourne vide sans casser.
 */
async function getEvents(): Promise<(EventWithClub & { distance_km: number | null })[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('upcoming_events')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(50);

    if (error) {
      // Si la vue n'existe pas (migration pas encore exécutée), on ignore
      console.warn('[page] upcoming_events indisponible:', error.message);
      return [];
    }

    return (data ?? []).map((e) => ({
      ...e,
      distance_km: distanceFromAmiens(e.club_lat, e.club_lng),
    }));
  } catch (error) {
    console.warn('[page] Erreur fetch events:', error);
    return [];
  }
}

export default async function HomePage() {
  // Fetch parallèle des deux sources pour ne pas doubler la latence
  const [tournaments, events] = await Promise.all([getTournaments(), getEvents()]);

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

          {/* CTA secondaire vers le widget de recherche de creneau */}
          <div className="pt-2">
            <Link
              href="/jouer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Ou trouve un terrain dispo en un clic
            </Link>
          </div>

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
      <section className="container mx-auto px-4 pb-12">
        <TournamentList tournaments={tournaments} />
      </section>

      {/* Section Americano & événements non-homologués (visible seulement s'il
          y a au moins un event publié — évite une section vide qui fait
          "site abandonné") */}
      {events.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-2xl font-bold">Americano & événements</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Tournois Americano, portes ouvertes, initiations et stages organisés
            par les clubs locaux. Hors calendrier FFT officiel.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        </section>
      )}

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
