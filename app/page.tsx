// ============================================
// Page d'accueil — Liste des tournois
// ============================================
// Server component qui fetch les tournois côté serveur (SEO + perf).
// Les filtres interactifs sont délégués à <FilterPanel /> en client component.

import Link from 'next/link';
import { MapPin, Trophy, Calendar, Sparkles, Search, Users } from 'lucide-react';

import { EventCard } from '@/components/event-card';
import { TournamentList } from '@/components/tournament-list';
import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';
import { distanceFromAmiens } from '@/lib/geo';
import type { TournamentWithClub } from '@/types/tournament';
import type { EventWithClub } from '@/types/event';

/**
 * Compteurs publics affichés dans le hero pour donner du signal de vie au site.
 * Tout en parallèle pour ne pas allonger la latence — chaque count est une
 * petite query HEAD comptée par Postgres (très rapide).
 */
async function getStats() {
  try {
    const supabase = createAdminClient();
    const [tournaments, profiles, matchRequests] = await Promise.all([
      supabase
        .from('upcoming_tournaments')
        .select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('public_match_requests')
        .select('id', { count: 'exact', head: true }),
    ]);
    return {
      tournaments: tournaments.count ?? 0,
      players: profiles.count ?? 0,
      matchRequests: matchRequests.count ?? 0,
    };
  } catch (error) {
    console.warn('[page] stats indisponibles:', error);
    return { tournaments: 0, players: 0, matchRequests: 0 };
  }
}

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
  // Fetch parallèle : tournois + events + stats — une seule attente réseau
  const [tournaments, events, stats] = await Promise.all([
    getTournaments(),
    getEvents(),
    getStats(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* Hero section — version condensée avec visuel de fond */}
      <section className="relative overflow-hidden">
        {/* Image de fond : terrain de padel libre de droits Unsplash.
            Désaturée + overlay pour rester lisible. Le background-image
            est posé via CSS inline pour ne pas devoir passer par next/image
            (next/image protected demande un domain config, trop pour ici). */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1600&q=80&auto=format')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-emerald-50/40 via-transparent to-white"
          aria-hidden
        />

        <div className="container relative mx-auto px-4 py-10 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
              <Trophy className="w-3.5 h-3.5" />
              Tournois homologués FFT · Amiens & Hauts-de-France
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Le padel local,{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                en un endroit
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Tournois, créneaux dispos, partenaires de jeu — tout au même
              endroit, gratuit, local.
            </p>

            {/* CTA secondaires — discrets, regroupés */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Link
                href="/jouer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium hover:border-emerald-500 hover:text-emerald-700 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Trouver un créneau
              </Link>
              <Link
                href="/matchs"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium hover:border-emerald-500 hover:text-emerald-700 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Chercher un partenaire
              </Link>
            </div>

            {/* Compteurs publics — signal de vie */}
            <div className="flex flex-wrap justify-center gap-4 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <strong className="text-foreground">{stats.tournaments}</strong>{' '}
              tournois
            </div>
            {stats.players > 0 && (
              <Link
                href="/matchs"
                className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <strong className="text-foreground">{stats.players}</strong>{' '}
                joueur{stats.players > 1 ? 's' : ''}
                {stats.matchRequests > 0 && (
                  <span> · {stats.matchRequests} annonce{stats.matchRequests > 1 ? 's' : ''}</span>
                )}
              </Link>
            )}
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
        <p className="mt-4 flex flex-wrap justify-center gap-4">
          <Link href="/a-propos" className="underline hover:text-foreground">
            À propos
          </Link>
          <Link href="/mentions-legales" className="underline hover:text-foreground">
            Mentions légales
          </Link>
        </p>
      </footer>
    </div>
  );
}
