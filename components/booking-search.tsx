// ============================================
// Widget de recherche de créneau — /jouer
// ============================================
// Client component qui gère le formulaire (date/heure/distance/recherche)
// ET l'affichage des clubs filtrés. Pas de fetch côté client : les clubs
// sont passés en prop depuis le server component parent.
//
// UX : l'utilisateur règle ses critères, voit les clubs candidats triés
// par distance, et clique sur "Voir les dispos" qui ouvre la page de
// réservation officielle (Playtomic ou site du club) dans un nouvel onglet.
// On affiche aussi téléphone, lien Maps, et un bouton "Mon centre n'est pas
// listé ?" pour les retours utilisateur.

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  LayoutGrid,
  Mail,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Search,
  Sliders,
} from 'lucide-react';

import { ClubsMapClient } from './clubs-map-client';
import { BOOKING_HOURS, BOOKING_PLATFORM_LABELS, buildBookingUrl } from '@/lib/booking';
import { cn, formatPhone } from '@/lib/utils';
import type { BookableClub, BookingPlatform } from '@/types/tournament';

interface BookingSearchProps {
  clubs: (BookableClub & { distance_km: number | null })[];
}

// Options de distance pour le filtre
const DISTANCE_OPTIONS = [
  { value: 30, label: '30 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: null, label: 'Toutes' },
];

// Couleurs par plateforme pour les badges (cohérent avec event-card.tsx)
const PLATFORM_BADGE_COLORS: Record<BookingPlatform, string> = {
  playtomic: 'bg-blue-100 text-blue-800 border-blue-200',
  doinsport: 'bg-purple-100 text-purple-800 border-purple-200',
  anybuddy: 'bg-pink-100 text-pink-800 border-pink-200',
  custom: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  none: 'bg-slate-100 text-slate-600 border-slate-200',
};

// CTA selon la plateforme : on adapte le texte au contexte (Playtomic affiche
// directement les dispos, un site custom envoie sur la page de booking maison
// qui peut être un formulaire, un appel téléphonique, etc.)
function getCtaLabel(platform: BookingPlatform | null): string {
  switch (platform) {
    case 'playtomic':
    case 'doinsport':
    case 'anybuddy':
      return 'Voir les dispos';
    case 'custom':
      return 'Réserver sur le site du club';
    default:
      return 'En savoir plus';
  }
}

/**
 * Retourne la date du jour au format YYYY-MM-DD (pour l'input type=date).
 * Calculé côté client uniquement (pas pendant le SSR) pour éviter un
 * mismatch d'hydratation si le serveur et le client ne sont pas sur la
 * même timezone.
 */
function getTodayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Normalise une chaîne pour la recherche : sans accents, en minuscules,
 * pour matcher "amiens" autant que "Amiens" ou "AMIÉNS".
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

type ViewMode = 'list' | 'map';

export function BookingSearch({ clubs }: BookingSearchProps) {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('18');
  const [maxDistance, setMaxDistance] = useState<number | null>(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Initialise la date au mount, côté client uniquement (cf. comment ci-dessus)
  useEffect(() => {
    setDate(getTodayIso());
  }, []);

  // Filtrage cumulé : recherche textuelle puis distance
  const filteredClubs = useMemo(() => {
    const normalizedQuery = normalize(searchQuery.trim());

    return clubs.filter((club) => {
      // Filtre par nom/ville si une recherche est saisie
      if (normalizedQuery.length > 0) {
        const haystack = normalize(`${club.name} ${club.city ?? ''}`);
        if (!haystack.includes(normalizedQuery)) return false;
      }

      // Filtre par distance (on garde les clubs sans coords pour ne pas les invisibiliser)
      if (
        maxDistance !== null &&
        club.distance_km !== null &&
        club.distance_km > maxDistance
      ) {
        return false;
      }

      return true;
    });
  }, [clubs, searchQuery, maxDistance]);

  // Tri : distance croissante, clubs sans coords en dernier
  const sortedClubs = useMemo(() => {
    return [...filteredClubs].sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });
  }, [filteredClubs]);

  const dateLabel = date ? format(parseISO(date), 'EEEE d MMMM', { locale: fr }) : null;
  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ============================================
          Formulaire de recherche
          ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
        {/* Ligne 1 : recherche par nom (full width, mise en avant) */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            <Search className="w-3.5 h-3.5" />
            Rechercher un centre (optionnel)
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ex : Cagny, AAC, Multiball..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        {/* Ligne 2 : date / heure / distance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldWithIcon icon={Calendar} label="Date">
            <input
              type="date"
              value={date}
              min={getTodayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
            />
          </FieldWithIcon>

          <FieldWithIcon icon={Clock} label="Heure">
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm bg-white"
            >
              {BOOKING_HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}h00
                </option>
              ))}
            </select>
          </FieldWithIcon>

          <FieldWithIcon icon={Sliders} label="Distance max depuis Cagny">
            <div className="flex flex-wrap gap-1.5">
              {DISTANCE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setMaxDistance(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    maxDistance === opt.value
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldWithIcon>
        </div>

        {/* Récap textuel */}
        {dateLabel && (
          <p className="text-sm text-muted-foreground capitalize">
            Tu cherches à jouer le <strong className="text-foreground">{dateLabel}</strong> à{' '}
            <strong className="text-foreground">{hour}h00</strong>
            {maxDistance !== null && (
              <>
                , à moins de <strong className="text-foreground">{maxDistance} km</strong> de Cagny
              </>
            )}
            {hasActiveSearch && (
              <>
                {' '}— filtré sur «&nbsp;<strong className="text-foreground">{searchQuery}</strong>&nbsp;»
              </>
            )}
            .
          </p>
        )}
      </div>

      {/* ============================================
          Résultats — bascule Liste / Carte
          ============================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {sortedClubs.length} centre{sortedClubs.length > 1 ? 's' : ''} trouvé
            {sortedClubs.length > 1 ? 's' : ''}
          </h2>

          {/* Bascule Liste / Carte */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 p-0.5 bg-white">
            <ViewModeButton
              active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              icon={LayoutGrid}
              label="Liste"
            />
            <ViewModeButton
              active={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              icon={MapIcon}
              label="Carte"
            />
          </div>
        </div>

        {sortedClubs.length === 0 ? (
          <EmptyState onClearSearch={() => setSearchQuery('')} hasSearch={hasActiveSearch} />
        ) : viewMode === 'map' ? (
          <ClubsMapClient clubs={sortedClubs} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedClubs.map((club) => (
              <ClubBookingCard key={club.id} club={club} date={date} hour={hour} />
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          Centre manquant ?
          ============================================ */}
      <MissingClubCta />
    </div>
  );
}

// ============================================
// Card d'un club avec contact + Maps + CTA Réserver
// ============================================
function ClubBookingCard({
  club,
  date,
  hour,
}: {
  club: BookableClub & { distance_km: number | null };
  date: string;
  hour: string;
}) {
  // Génère l'URL deep-link uniquement quand la date est définie (post-mount)
  const bookingUrl = date ? buildBookingUrl(club, date, hour) : null;
  const ctaLabel = getCtaLabel(club.booking_platform);
  const platformLabel = club.booking_platform
    ? BOOKING_PLATFORM_LABELS[club.booking_platform]
    : null;
  const platformColor = club.booking_platform
    ? PLATFORM_BADGE_COLORS[club.booking_platform]
    : null;

  // URL Google Maps : on utilise le nom + la ville si dispo, sinon les coords
  const mapsUrl = (() => {
    if (club.latitude !== null && club.longitude !== null) {
      return `https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}`;
    }
    const query = [club.name, club.city].filter(Boolean).join(' ');
    return query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : null;
  })();

  return (
    <article className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
      {/* Header : nom (cliquable vers la fiche club) + distance */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-base leading-tight">
          <Link
            href={`/club/${club.id}`}
            className="hover:text-emerald-700 transition-colors"
          >
            {club.name}
          </Link>
        </h3>
        {club.distance_km !== null && (
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 ml-2 mt-0.5">
            {club.distance_km} km
          </span>
        )}
      </div>

      {/* Ville + code postal */}
      {club.city && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {club.city}
            {club.postal_code && ` · ${club.postal_code}`}
          </span>
        </div>
      )}

      {/* Badge plateforme */}
      {platformLabel && platformColor && (
        <div className="mb-3">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium',
              platformColor
            )}
          >
            {platformLabel}
          </span>
        </div>
      )}

      {/* Contacts (si dispo) */}
      <div className="space-y-1 mb-4">
        {club.contact_phone && (
          <a
            href={`tel:${club.contact_phone}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-700 transition-colors"
          >
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span>{formatPhone(club.contact_phone)}</span>
          </a>
        )}
        {club.contact_email && (
          <a
            href={`mailto:${club.contact_email}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-700 transition-colors"
          >
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{club.contact_email}</span>
          </a>
        )}
      </div>

      {/* Actions — pousse en bas de la card */}
      <div className="mt-auto pt-2 space-y-2">
        {/* CTA principal : redirection vers la plateforme */}
        {bookingUrl ? (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            {ctaLabel}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm cursor-not-allowed"
          >
            Choisis une date
          </button>
        )}

        {/* Lien Google Maps en secondaire */}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Itinéraire
          </a>
        )}
      </div>
    </article>
  );
}

// ============================================
// État vide (aucun résultat)
// ============================================
function EmptyState({
  hasSearch,
  onClearSearch,
}: {
  hasSearch: boolean;
  onClearSearch: () => void;
}) {
  return (
    <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-slate-200 space-y-3">
      <p>Aucun centre ne correspond à tes critères.</p>
      {hasSearch ? (
        <button
          onClick={onClearSearch}
          className="text-sm text-emerald-700 underline hover:text-emerald-800"
        >
          Effacer la recherche
        </button>
      ) : (
        <p className="text-sm">Essaie d&apos;augmenter la distance max.</p>
      )}
    </div>
  );
}

// ============================================
// CTA "Ton centre n'est pas listé ?"
// ============================================
// Permet aux utilisateurs locaux de signaler les centres manquants via mail.
// Le sujet du mail est pré-rempli pour qu'on les classe facilement.
function MissingClubCta() {
  const mailto = `mailto:contact@padel-amiens.fr?subject=${encodeURIComponent(
    'Ajout d\'un centre padel'
  )}&body=${encodeURIComponent(
    'Bonjour,\n\nLe centre suivant n\'apparaît pas sur Padel Amiens :\n\n' +
      '- Nom : \n' +
      '- Ville : \n' +
      '- Site / plateforme de réservation : \n\n' +
      'Merci !'
  )}`;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm">
      <p className="font-medium mb-1">Ton centre n&apos;est pas listé ?</p>
      <p className="text-muted-foreground mb-3">
        Notre base est en cours d&apos;enrichissement. Envoie-nous le nom + la ville du
        centre manquant, on l&apos;ajoute sous quelques jours.
      </p>
      <a
        href={mailto}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
      >
        <Mail className="w-3.5 h-3.5" />
        Signaler un centre manquant
      </a>
    </div>
  );
}

// ============================================
// Bouton bascule Liste / Carte
// ============================================
function ViewModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Search;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
        active
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ============================================
// Champ formulaire avec icône
// ============================================
function FieldWithIcon({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Calendar;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
    </div>
  );
}
