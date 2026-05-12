// ============================================
// Page d'accueil — Landing page
// ============================================
// Approche refondue : la home n'est plus une liste de 99 tournois mais une
// vraie landing avec hero impactant + 4 sections d'aperçu + CTAs clairs.
// Les listes complètes vivent sur leurs pages dédiées (/tournois, /jouer,
// /matchs) où on peut filtrer et chercher tranquillement.

import Link from 'next/link';
import { Sparkles, Trophy, Users } from 'lucide-react';

import { ClubsPreview } from '@/components/clubs-preview';
import { EventCard } from '@/components/event-card';
import { HomeHero } from '@/components/home-hero';
import { HowItWorks } from '@/components/how-it-works';
import { MatchesPreview } from '@/components/matches-preview';
import { TournamentsPreview } from '@/components/tournaments-preview';
import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';
import { distanceFromAmiens } from '@/lib/geo';
import { getCurrentUser } from '@/lib/user';
import type { BookableClub, TournamentWithClub } from '@/types/tournament';
import type { EventWithClub } from '@/types/event';

export const revalidate = 300;

// ============================================
// Fetchers — tout en parallèle pour ne pas allonger la latence
// ============================================

async function getStats() {
  try {
    const supabase = createAdminClient();
    const [tournaments, profiles, matchRequests] = await Promise.all([
      supabase.from('upcoming_tournaments').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('public_match_requests').select('id', { count: 'exact', head: true }),
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

async function getUpcomingTournaments(): Promise<
  (TournamentWithClub & { distance_km: number | null })[]
> {
  const supabase = createAdminClient();
  // On limite à 12 pour la home (preview montre 6, on garde une marge si on
  // veut filtrer plus tard côté client). La liste complète est sur /tournois.
  const { data, error } = await supabase
    .from('upcoming_tournaments')
    .select('*')
    .order('start_date', { ascending: true })
    .limit(12);

  if (error) {
    console.error('[page] tournois:', error);
    return [];
  }
  return (data ?? []).map((t) => ({
    ...t,
    distance_km: distanceFromAmiens(t.club_lat, t.club_lng),
  }));
}

async function getFeaturedClubs(): Promise<
  (BookableClub & { distance_km: number | null })[]
> {
  // Sélection : clubs qui ont une cover_image_url (= les 5 principaux qu'on
  // a photographiés à la main). On limite à 4 pour une grille bien carrée.
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('clubs')
      .select(
        'id, name, city, postal_code, latitude, longitude, booking_platform, ' +
          'booking_url_template, contact_email, contact_phone, cover_image_url'
      )
      .not('cover_image_url', 'is', null)
      .limit(4);

    if (error) {
      console.warn('[page] clubs:', error);
      return [];
    }

    const rows = (data ?? []) as unknown as BookableClub[];
    return rows.map((c) => ({
      ...c,
      distance_km: distanceFromAmiens(c.latitude, c.longitude),
    }));
  } catch (error) {
    console.warn('[page] clubs:', error);
    return [];
  }
}

async function getRecentMatchRequests() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('public_match_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

async function getUpcomingEvents(): Promise<
  (EventWithClub & { distance_km: number | null })[]
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('upcoming_events')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(6);

    if (error) return [];
    return (data ?? []).map((e) => ({
      ...e,
      distance_km: distanceFromAmiens(e.club_lat, e.club_lng),
    }));
  } catch {
    return [];
  }
}

// ============================================
// Page
// ============================================

export default async function HomePage() {
  const [tournaments, clubs, events, stats, matchRequests, currentUser] =
    await Promise.all([
      getUpcomingTournaments(),
      getFeaturedClubs(),
      getUpcomingEvents(),
      getStats(),
      getRecentMatchRequests(),
      getCurrentUser(),
    ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* Hero : visuel impactant avec photo padel bien visible + parallax léger */}
      <HomeHero stats={stats} />

      {/* "Comment ça marche" — 3 étapes claires */}
      <HowItWorks />

      {/* Preview des clubs avec leurs vraies photos */}
      <ClubsPreview clubs={clubs} />

      {/* Tournois en LIGNE horizontale scrollable (demande Hugo) */}
      <TournamentsPreview tournaments={tournaments} totalCount={stats.tournaments} />

      {/* Partenaires (annonces matchmaking) — JUSTE EN DESSOUS des tournois.
          Caché si zéro annonce pour éviter l'effet "site mort". */}
      {matchRequests.length > 0 && (
        <MatchesPreview
          requests={matchRequests}
          currentUserId={currentUser?.id ?? null}
          totalCount={stats.matchRequests}
        />
      )}

      {/* Section Americano — visible si au moins un event publié */}
      {events.length > 0 && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-7 h-7 text-amber-600" aria-hidden />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Americano & événements
            </h2>
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

      {/* CTA final si l'utilisateur n'est pas connecté */}
      {!currentUser && (
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 text-white shadow-xl">
            <Trophy className="w-10 h-10 mx-auto mb-4 opacity-90" aria-hidden />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Rejoins la communauté padel locale
            </h2>
            <p className="text-emerald-50 mb-6 max-w-xl mx-auto">
              Crée ton compte (30 secondes) pour poster une annonce de match,
              voir le contact des autres joueurs et sauvegarder tes tournois favoris.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors"
            >
              <Users className="w-5 h-5" aria-hidden />
              Créer mon compte gratuit
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
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
