// ============================================
// Widget de recherche de créneau — /jouer
// ============================================
// Client component qui gère le formulaire (date/heure/distance) ET l'affichage
// des clubs filtrés. Pas de fetch côté client : les clubs sont passés en prop
// depuis le server component parent.
//
// UX cible : l'utilisateur règle ses 3 critères, voit immédiatement les clubs
// candidats avec leur distance, et clique sur "Réserver →" qui ouvre la page
// Playtomic du club dans un nouvel onglet avec sa date/heure pré-remplies.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight, Calendar, Clock, MapPin, Sliders } from 'lucide-react';

import { BOOKING_HOURS, BOOKING_PLATFORM_LABELS, buildBookingUrl } from '@/lib/booking';
import { cn } from '@/lib/utils';
import type { BookableClub } from '@/types/tournament';

interface BookingSearchProps {
  clubs: (BookableClub & { distance_km: number | null })[];
}

// Options de distance pour le filtre (mêmes valeurs que la liste tournois
// pour rester cohérent visuellement)
const DISTANCE_OPTIONS = [
  { value: 30, label: '30 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: null, label: 'Toutes' },
];

/**
 * Retourne la date du jour au format YYYY-MM-DD (pour l'input type=date).
 * Calculé côté client uniquement (pas pendant le SSR) pour éviter un
 * mismatch d'hydratation si le serveur et le client ne sont pas
 * exactement sur la même TZ.
 */
function getTodayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function BookingSearch({ clubs }: BookingSearchProps) {
  // État initial : date = '' (placeholder visible) puis remplie au mount.
  // Utiliser getTodayIso() en initialState provoquerait un mismatch d'hydra
  // si le rendu serveur tombait sur un autre jour que le client (timezone).
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('18'); // 18h = créneau le plus demandé
  const [maxDistance, setMaxDistance] = useState<number | null>(50);

  // Initialise la date au mount, côté client uniquement.
  // useEffect garantit qu'on s'exécute APRÈS l'hydratation : pas de mismatch
  // entre rendu serveur (date vide) et premier render client (date du jour).
  useEffect(() => {
    setDate(getTodayIso());
  }, []);

  // Filtre les clubs selon la distance choisie (on garde tous les clubs
  // sans coordonnées pour ne pas les invisibiliser au cas où le géocodage
  // aurait raté pour eux)
  const visibleClubs = useMemo(() => {
    if (maxDistance === null) return clubs;
    return clubs.filter(
      (c) => c.distance_km === null || c.distance_km <= maxDistance
    );
  }, [clubs, maxDistance]);

  // Tri : d'abord par distance croissante (clubs sans coords en dernier)
  const sortedClubs = useMemo(() => {
    return [...visibleClubs].sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });
  }, [visibleClubs]);

  const dateLabel = date ? format(parseISO(date), 'EEEE d MMMM', { locale: fr }) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ============================================
          Formulaire de recherche
          ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date */}
          <FieldWithIcon icon={Calendar} label="Date">
            <input
              type="date"
              value={date}
              min={getTodayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
            />
          </FieldWithIcon>

          {/* Heure */}
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

          {/* Distance max */}
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

        {/* Récap textuel du critère choisi (rassurant pour l'utilisateur) */}
        {dateLabel && (
          <p className="mt-4 text-sm text-muted-foreground capitalize">
            Tu cherches à jouer le <strong className="text-foreground">{dateLabel}</strong> à{' '}
            <strong className="text-foreground">{hour}h00</strong>
            {maxDistance !== null && (
              <>
                , à moins de <strong className="text-foreground">{maxDistance} km</strong> de Cagny
              </>
            )}
            .
          </p>
        )}
      </div>

      {/* ============================================
          Résultats : grille de cards cliquables
          ============================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {sortedClubs.length} centre{sortedClubs.length > 1 ? 's' : ''} dans ta zone
          </h2>
        </div>

        {sortedClubs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-slate-200">
            <p>Aucun centre dans ta zone. Essaie d&apos;augmenter la distance max.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedClubs.map((club) => (
              <ClubBookingCard
                key={club.id}
                club={club}
                date={date}
                hour={hour}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Sous-composant : Card d'un club avec bouton de réservation
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
  const platformLabel = club.booking_platform
    ? BOOKING_PLATFORM_LABELS[club.booking_platform]
    : null;

  return (
    <article className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
      {/* Header : nom + distance */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-base">{club.name}</h3>
        {club.distance_km !== null && (
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 ml-2">
            {club.distance_km} km
          </span>
        )}
      </div>

      {/* Ville + code postal */}
      {club.city && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>
            {club.city}
            {club.postal_code && ` (${club.postal_code})`}
          </span>
        </div>
      )}

      {/* Plateforme */}
      {platformLabel && (
        <div className="text-xs text-muted-foreground mb-4">
          Réservation via <strong>{platformLabel}</strong>
        </div>
      )}

      {/* CTA Réserver — pousse en bas de la card grâce à mt-auto */}
      <div className="mt-auto pt-2">
        {bookingUrl ? (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Voir les dispos
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm cursor-not-allowed"
          >
            Choisis une date
          </button>
        )}
      </div>
    </article>
  );
}

// ============================================
// Sous-composant : champ de formulaire avec icône + label
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
