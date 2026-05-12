// ============================================
// Page détail d'un club — /club/[id]
// ============================================
// Server component pour le SEO local long-tail. Une fiche par club avec :
//   1. Hero (nom, ville, badge plateforme)
//   2. Mini-carte Leaflet centrée sur le club (composant client séparé)
//   3. CTA "Réserver" qui ouvre la plateforme officielle
//   4. Liste des prochains tournois homologués organisés par ce club
//   5. JSON-LD SportsClub pour aider Google à comprendre que c'est un lieu
//      sportif (apparition possible dans le rich snippet "Local Places").

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Trophy,
} from 'lucide-react';

import { ClubMapClient } from '@/components/club-map-client';
import { Header } from '@/components/header';
import { BOOKING_PLATFORM_LABELS, buildBookingUrl } from '@/lib/booking';
import { CATEGORY_COLORS } from '@/lib/constants';
import { distanceFromAmiens } from '@/lib/geo';
import { createAdminClient } from '@/lib/supabase';
import { cn, formatPhone } from '@/lib/utils';
import type { BookableClub, TournamentWithClub } from '@/types/tournament';

// Revalidation horaire (les infos club bougent rarement)
export const revalidate = 3600;

interface PageProps {
  params: { id: string };
}

// ============================================
// Helpers Supabase
// ============================================
async function getClub(id: string): Promise<BookableClub | null> {
  // Sécurité simple : on accepte uniquement des slugs alphanumériques avec
  // tirets pour éviter les requêtes farfelues des bots de scan.
  if (!/^[a-z0-9-]{1,80}$/i.test(id)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clubs')
    .select(
      'id, name, city, postal_code, latitude, longitude, ' +
      'booking_platform, booking_url_template, contact_email, contact_phone, cover_image_url'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[club/[id]] Erreur fetch:', error);
    return null;
  }
  return data as BookableClub | null;
}

async function getUpcomingTournamentsForClub(
  clubId: string
): Promise<TournamentWithClub[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('upcoming_tournaments')
    .select('*')
    .eq('club_id', clubId)
    .order('start_date', { ascending: true })
    .limit(20);

  if (error) {
    console.error('[club/[id]] Erreur tournois:', error);
    return [];
  }
  return (data ?? []) as TournamentWithClub[];
}

// ============================================
// Pré-génération des fiches club au build
// ============================================
export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('clubs').select('id');
    return (data ?? []).map((c) => ({ id: c.id }));
  } catch {
    return [];
  }
}

// ============================================
// Metadata SEO dynamique
// ============================================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const club = await getClub(params.id);
  if (!club) return { title: 'Club introuvable' };

  const cityLabel = club.city ? `à ${club.city}` : '';
  const title = `${club.name} — Padel ${cityLabel}`;
  const description = `Coordonnées, plan d'accès, prochains tournois et réservation des courts de padel au ${club.name}${cityLabel ? `, ${cityLabel}` : ''}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'fr_FR' },
    alternates: { canonical: `/club/${params.id}` },
  };
}

// ============================================
// Genre labels (dupliqués depuis tournament-card.tsx — on factorisera si on
// les utilise dans un 3e endroit, en attendant duplication acceptable)
// ============================================
const GENDER_LABELS: Record<string, string> = {
  messieurs: 'Messieurs',
  dames: 'Dames',
  mixte: 'Mixte',
};

// ============================================
// Composant page
// ============================================
export default async function ClubPage({ params }: PageProps) {
  // Fetch parallèle club + tournois pour ne pas doubler la latence
  const [club, tournaments] = await Promise.all([
    getClub(params.id),
    getUpcomingTournamentsForClub(params.id),
  ]);

  if (!club) notFound();

  const distance = distanceFromAmiens(club.latitude, club.longitude);
  const platformLabel = club.booking_platform
    ? BOOKING_PLATFORM_LABELS[club.booking_platform]
    : null;

  // Pour le bouton CTA, on génère un deep-link "aujourd'hui à 18h" — le user
  // peut affiner depuis la page Playtomic. On ne passe pas par useState ici
  // (server component), donc c'est du best-effort par défaut.
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const bookingUrl = buildBookingUrl(club, todayIso, '18');

  // Google Maps URL : par coords si dispo, sinon recherche par nom + ville
  const mapsUrl = (() => {
    if (club.latitude !== null && club.longitude !== null) {
      return `https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}`;
    }
    const q = [club.name, club.city].filter(Boolean).join(' ');
    return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
  })();

  // JSON-LD SportsClub — aide Google à comprendre que c'est un lieu sportif
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsClub',
    name: club.name,
    sport: 'Padel',
    ...(club.contact_phone ? { telephone: club.contact_phone } : {}),
    ...(club.contact_email ? { email: club.contact_email } : {}),
    ...(club.latitude != null && club.longitude != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: club.latitude,
            longitude: club.longitude,
          },
        }
      : {}),
    ...(club.city || club.postal_code
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: club.city ?? undefined,
            postalCode: club.postal_code ?? undefined,
            addressCountry: 'FR',
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ============================================
          Photo hero plein écran (si dispo)
          ============================================
          Hotlink vers l'image du club sur son site officiel. Pas de
          next/image pour éviter la config remotePatterns. Ratio fixe 21:9
          desktop / 16:9 mobile pour un look "couverture sportive".
          eslint-disable-next-line @next/next/no-img-element : intentionnel. */}
      {club.cover_image_url && (
        <div className="relative w-full h-48 md:h-72 overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={club.cover_image_url}
            alt={`${club.name} — vue du complexe`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          {/* Dégradé en bas pour fondre l'image dans le contenu */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />
        </div>
      )}

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* Breadcrumb retour */}
        <Link
          href="/jouer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tous les centres
        </Link>

        {/* ============================================
            Hero textuel sous la photo
            ============================================ */}
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{club.name}</h1>
            {distance !== null && (
              <span className="text-sm text-muted-foreground whitespace-nowrap mt-1.5">
                {distance} km de Cagny
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {club.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {club.city}
                {club.postal_code && ` · ${club.postal_code}`}
              </span>
            )}
            {platformLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium">
                Réservation via {platformLabel}
              </span>
            )}
          </div>
        </header>

        {/* ============================================
            Carte + Actions (deux colonnes desktop)
            ============================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Carte sur 2/3 si on a des coords */}
          <div className="md:col-span-2">
            {club.latitude !== null && club.longitude !== null ? (
              <ClubMapClient
                latitude={club.latitude}
                longitude={club.longitude}
                clubName={club.name}
                city={club.city}
              />
            ) : (
              <div className="w-full h-72 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sm text-muted-foreground">
                Coordonnées GPS indisponibles
              </div>
            )}
          </div>

          {/* Actions latérales */}
          <aside className="space-y-3">
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                Réserver un terrain
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                <Navigation className="w-4 h-4" />
                Itinéraire
              </a>
            )}
            {/* Contacts */}
            {(club.contact_phone || club.contact_email) && (
              <div className="pt-2 space-y-1.5 text-sm">
                {club.contact_phone && (
                  <a
                    href={`tel:${club.contact_phone}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-emerald-700 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {formatPhone(club.contact_phone)}
                  </a>
                )}
                {club.contact_email && (
                  <a
                    href={`mailto:${club.contact_email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-emerald-700 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{club.contact_email}</span>
                  </a>
                )}
              </div>
            )}
          </aside>
        </section>

        {/* ============================================
            Prochains tournois organisés par ce club
            ============================================ */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" />
            Prochains tournois ici
          </h2>

          {tournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-slate-50 border border-slate-200 rounded-xl p-4">
              Aucun tournoi homologué FFT n&apos;est programmé pour l&apos;instant dans ce club.
              Reviens dans quelques jours — le calendrier se met à jour chaque matin.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
              {tournaments.map((t) => {
                const date = parseISO(t.start_date);
                const formatted = format(date, 'EEEE d MMMM yyyy', { locale: fr });
                const color = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.P100;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/tournoi/${t.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-md border text-xs font-semibold flex-shrink-0',
                          color
                        )}
                      >
                        {t.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium flex-shrink-0">
                        {GENDER_LABELS[t.gender] ?? t.gender}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 capitalize">
                          <CalendarDays className="w-3 h-3" />
                          {formatted}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Note transparence */}
        <p className="mt-8 text-xs text-muted-foreground text-center">
          Données publiques agrégées depuis Padel Magazine et sources publiques.
          Les disponibilités réelles sont affichées sur la plateforme officielle du club.
        </p>
      </main>
    </div>
  );
}
