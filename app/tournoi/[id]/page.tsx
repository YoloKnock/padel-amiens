// ============================================
// Page détail d'un tournoi — /tournoi/[id]
// ============================================
// Server component dédié à un tournoi unique. Objectifs :
//   1. SEO long-tail : chaque tournoi a sa propre URL indexable
//      ("P100 Amiens Padel mai 2026" devient une page à part entière)
//   2. Rich snippet Google "Events" via JSON-LD SportsEvent
//   3. UX claire : grosse card avec toutes les infos + CTA inscription
//
// Pourquoi server component plutôt que client ?
// → Le rendu côté serveur est indispensable pour que Google voie le contenu
//   (les bots ne lancent pas le JS). Et on n'a aucun état interactif ici.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Trophy,
  User,
} from 'lucide-react';

import { Header } from '@/components/header';
import { CATEGORY_COLORS } from '@/lib/constants';
import { distanceFromAmiens } from '@/lib/geo';
import { createAdminClient } from '@/lib/supabase';
import { cn, formatPhone } from '@/lib/utils';
import type { TournamentWithClub } from '@/types/tournament';

// Revalidation horaire — moins agressive que la page d'accueil (5 min) parce
// qu'une fiche tournoi change rarement après publication
export const revalidate = 3600;

interface PageProps {
  params: { id: string };
}

// Mapping genre → libellé affiché
const GENDER_LABELS: Record<string, string> = {
  messieurs: 'Messieurs',
  dames: 'Dames',
  mixte: 'Mixte',
};

// ============================================
// Récupération du tournoi par ID
// ============================================
async function getTournament(id: string): Promise<TournamentWithClub | null> {
  // On valide grossièrement le format UUID pour éviter un round-trip DB inutile
  // (les bots de scan tapent souvent /tournoi/admin, /tournoi/null, etc.)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('upcoming_tournaments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[tournoi/[id]] Erreur DB:', error);
    return null;
  }

  return data;
}

// ============================================
// Pré-génération des pages pour SSG
// ============================================
// On demande à Next.js de générer statiquement les pages des 100 prochains
// tournois au build time. Les tournois ajoutés plus tard seront rendus à la
// demande (ISR avec revalidate = 3600).
export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('upcoming_tournaments')
      .select('id')
      .order('start_date', { ascending: true })
      .limit(100);

    return (data ?? []).map((t) => ({ id: t.id }));
  } catch (error) {
    // Au build initial sans Supabase configurée, on retourne une liste vide
    // plutôt que de planter. ISR prendra le relais en runtime.
    console.warn('[tournoi/[id]] generateStaticParams skipped:', error);
    return [];
  }
}

// ============================================
// Metadata SEO dynamique
// ============================================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tournament = await getTournament(params.id);

  if (!tournament) {
    return { title: 'Tournoi introuvable' };
  }

  const date = parseISO(tournament.start_date);
  const formattedDate = format(date, 'd MMMM yyyy', { locale: fr });
  const genderLabel = GENDER_LABELS[tournament.gender] ?? tournament.gender;
  const location = tournament.club_city
    ? `${tournament.club_name ?? ''} (${tournament.club_city})`
    : tournament.club_name ?? '';

  const title = `${tournament.category} ${genderLabel} — ${tournament.club_name ?? 'Club'} le ${formattedDate}`;
  const description = `Tournoi padel homologué FFT ${tournament.category} ${genderLabel} organisé le ${formattedDate} à ${location}. Inscription via Ten'Up.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'fr_FR',
    },
    alternates: {
      canonical: `/tournoi/${params.id}`,
    },
  };
}

// ============================================
// Composant page
// ============================================
export default async function TournoiPage({ params }: PageProps) {
  const tournament = await getTournament(params.id);

  if (!tournament) notFound();

  const date = parseISO(tournament.start_date);
  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
  const categoryColor = CATEGORY_COLORS[tournament.category] ?? CATEGORY_COLORS.P100;
  const distance = distanceFromAmiens(tournament.club_lat, tournament.club_lng);

  // JSON-LD SportsEvent — aide Google à afficher la fiche en rich snippet
  // dans l'onglet "Events" (recherches géolocalisées "padel près de moi").
  // Spec : https://schema.org/SportsEvent
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${tournament.category} ${GENDER_LABELS[tournament.gender] ?? tournament.gender}`,
    sport: 'Padel',
    startDate: tournament.start_date,
    ...(tournament.end_date ? { endDate: tournament.end_date } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: tournament.title,
    ...(tournament.registration_url
      ? {
          offers: {
            '@type': 'Offer',
            url: tournament.registration_url,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    ...(tournament.club_name
      ? {
          location: {
            '@type': 'Place',
            name: tournament.club_name,
            ...(tournament.club_city || tournament.club_postal_code
              ? {
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: tournament.club_city ?? undefined,
                    postalCode: tournament.club_postal_code ?? undefined,
                    addressCountry: 'FR',
                  },
                }
              : {}),
            ...(tournament.club_lat != null && tournament.club_lng != null
              ? {
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: tournament.club_lat,
                    longitude: tournament.club_lng,
                  },
                }
              : {}),
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* JSON-LD injecté pour les crawlers (invisible pour l'utilisateur) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        {/* Retour à la liste */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tous les tournois
        </Link>

        {/* Card principale */}
        <article className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm font-semibold',
                categoryColor
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              {tournament.category}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-sm font-medium">
              {GENDER_LABELS[tournament.gender] ?? tournament.gender}
            </span>
            {distance !== null && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-50 text-slate-600 text-sm">
                {distance} km de Cagny
              </span>
            )}
          </div>

          {/* Titre */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
            {tournament.title}
          </h1>

          {/* Infos principales */}
          <div className="space-y-4 text-base">
            <InfoRow icon={CalendarDays}>
              <span className="capitalize">{formattedDate}</span>
            </InfoRow>

            {tournament.club_name && (
              <InfoRow icon={MapPin}>
                <div>
                  <div className="font-medium">{tournament.club_name}</div>
                  {tournament.club_city && (
                    <div className="text-sm text-muted-foreground">
                      {tournament.club_city}
                      {tournament.club_postal_code && ` (${tournament.club_postal_code})`}
                    </div>
                  )}
                </div>
              </InfoRow>
            )}

            {tournament.referee && (
              <InfoRow icon={User}>
                <span>
                  Juge-arbitre : <strong>{tournament.referee}</strong>
                </span>
              </InfoRow>
            )}
          </div>

          {/* CTA Inscription */}
          {tournament.registration_url && (
            <a
              href={tournament.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              Voir la fiche officielle et s&apos;inscrire
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Ajout au calendrier — fichier .ics téléchargeable */}
          <a
            href={`/api/ics/tournoi/${tournament.id}`}
            className="mt-3 inline-flex items-center justify-center gap-2 w-full px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <CalendarPlus className="w-4 h-4" />
            Ajouter à mon agenda
          </a>

          {/* Contacts club */}
          {(tournament.club_email || tournament.club_phone) && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Contact organisateur
              </h2>
              <div className="space-y-2">
                {tournament.club_email && (
                  <a
                    href={`mailto:${tournament.club_email}`}
                    className="flex items-center gap-2 text-sm hover:text-emerald-700 transition-colors"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{tournament.club_email}</span>
                  </a>
                )}
                {tournament.club_phone && (
                  <a
                    href={`tel:${tournament.club_phone}`}
                    className="flex items-center gap-2 text-sm hover:text-emerald-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{formatPhone(tournament.club_phone)}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Note légale courte (la page mentions légales reste accessible) */}
        <p className="mt-6 text-xs text-muted-foreground text-center">
          Données publiques agrégées depuis Padel Magazine. Inscription officielle via
          Ten&apos;Up uniquement.
        </p>
      </main>
    </div>
  );
}

// ============================================
// Sous-composant : ligne d'info avec icône
// ============================================
function InfoRow({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-foreground">
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
