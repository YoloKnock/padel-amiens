// ============================================
// Composant Liste de tournois avec filtres
// ============================================
// Client component qui gère les filtres interactifs.
// Reçoit la liste complète depuis le server component (pas de fetch côté client).

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter, MapPin, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { TournamentCard } from './tournament-card';
import { CATEGORIES, GENDERS } from '@/types/tournament';
import type { TournamentWithClub } from '@/types/tournament';
import { distanceKm } from '@/lib/geo';
import { matchesDayType, type DayTypeFilter } from '@/lib/tournament-helpers';
import { cn } from '@/lib/utils';

const USER_LOCATION_STORAGE_KEY = 'padel-amiens.user-location';

interface TournamentListProps {
  tournaments: (TournamentWithClub & { distance_km: number | null })[];
}

// Options de distance pour le filtre
const DISTANCE_OPTIONS = [
  { value: null, label: 'Toutes' },
  { value: 30, label: '< 30 km' },
  { value: 50, label: '< 50 km' },
  { value: 100, label: '< 100 km' },
];

// Options de période — en nombre de jours à partir d'aujourd'hui
// null = pas de limite haute (tous les tournois à venir)
const PERIOD_OPTIONS = [
  { value: null, label: 'Toutes' },
  { value: 7, label: 'Cette semaine' },
  { value: 30, label: 'Ce mois' },
  { value: 90, label: '3 prochains mois' },
];

// Filtre semaine vs week-end. `null` = pas de filtre (tous les jours).
const DAY_TYPE_OPTIONS: { value: DayTypeFilter; label: string }[] = [
  { value: null, label: 'Tous' },
  { value: 'weekday', label: 'Semaine' },
  { value: 'weekend', label: 'Week-end' },
];

// Normalise une chaîne pour la recherche : sans accents, en minuscules.
// Permet de matcher "amiens" autant que "AMIÉNS" ou "Amiens".
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface UserLocation {
  lat: number;
  lng: number;
}

export function TournamentList({ tournaments }: TournamentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [maxDays, setMaxDays] = useState<number | null>(null);
  const [dayType, setDayType] = useState<DayTypeFilter>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Restaure la position utilisateur depuis localStorage au mount.
  // On la persiste pour que l'utilisateur n'ait pas à re-cliquer sur "Près
  // de moi" à chaque visite.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(USER_LOCATION_STORAGE_KEY);
      if (stored) setUserLocation(JSON.parse(stored));
    } catch {
      /* localStorage indisponible ou JSON cassé : on ignore */
    }
  }, []);

  // Demande la géolocalisation du navigateur (opt-in explicite).
  function requestGeolocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Ton navigateur ne supporte pas la géolocalisation.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGeoLoading(false);
        try {
          window.localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(loc));
        } catch {
          /* localStorage plein ou désactivé : on continue sans persistance */
        }
        toast.success('Position détectée, distances mises à jour.');
      },
      (err) => {
        setGeoLoading(false);
        const reason =
          err.code === err.PERMISSION_DENIED
            ? 'Tu as refusé la géolocalisation.'
            : 'Position indisponible.';
        toast.error(reason);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  function clearGeolocation() {
    setUserLocation(null);
    try {
      window.localStorage.removeItem(USER_LOCATION_STORAGE_KEY);
    } catch {
      /* ignoré */
    }
  }

  // Date butoir pour le filtre période : aujourd'hui + maxDays.
  // Calculée une fois par changement de filtre (et pas dans chaque .filter()).
  const periodCutoff = useMemo(() => {
    if (maxDays === null) return null;
    const cutoff = new Date();
    cutoff.setHours(23, 59, 59, 999);
    cutoff.setDate(cutoff.getDate() + maxDays);
    return cutoff;
  }, [maxDays]);

  // 1. On enrichit les tournois avec la distance "effective" (depuis le user
  //    si géoloc OK, sinon depuis Cagny = distance_km déjà calculée serveur).
  //    Recalculée à chaque changement de userLocation.
  const enriched = useMemo(() => {
    if (!userLocation) return tournaments;
    return tournaments.map((t) => {
      if (t.club_lat === null || t.club_lng === null) return t;
      return {
        ...t,
        distance_km: distanceKm(
          userLocation.lat,
          userLocation.lng,
          t.club_lat,
          t.club_lng
        ),
      };
    });
  }, [tournaments, userLocation]);

  // 2. Filtrage cumulé sur la liste enrichie
  const filtered = useMemo(() => {
    const normalizedQuery = normalize(searchQuery.trim());

    return enriched.filter((t) => {
      // Recherche textuelle (titre + club + ville)
      if (normalizedQuery.length > 0) {
        const haystack = normalize(
          `${t.title} ${t.club_name ?? ''} ${t.club_city ?? ''}`
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }

      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedGender && t.gender !== selectedGender) return false;
      if (maxDistance !== null && t.distance_km !== null && t.distance_km > maxDistance) {
        return false;
      }
      if (periodCutoff !== null) {
        // start_date est ISO YYYY-MM-DD, new Date() le parse correctement
        const tournamentDate = new Date(t.start_date);
        if (tournamentDate > periodCutoff) return false;
      }
      if (!matchesDayType(t.start_date, dayType)) return false;
      return true;
    });
  }, [
    enriched,
    searchQuery,
    selectedCategory,
    selectedGender,
    maxDistance,
    periodCutoff,
    dayType,
  ]);

  const hasFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== null ||
    selectedGender !== null ||
    maxDistance !== null ||
    maxDays !== null ||
    dayType !== null;

  function resetFilters() {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedGender(null);
    setMaxDistance(null);
    setMaxDays(null);
    setDayType(null);
  }

  return (
    <div className="space-y-6">
      {/* Barre de filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filtres
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Recherche libre (titre, club, ville) — mise en avant en haut */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            <Search className="w-3.5 h-3.5" />
            Rechercher (ville, club, tournoi)
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ex : Cagny, Amiens Padel, P100..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        {/* Filtre Catégorie */}
        <FilterGroup label="Catégorie">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              active={selectedCategory === cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
            >
              {cat}
            </FilterChip>
          ))}
        </FilterGroup>

        {/* Filtre Genre */}
        <FilterGroup label="Genre">
          {GENDERS.map((g) => (
            <FilterChip
              key={g}
              active={selectedGender === g}
              onClick={() => setSelectedGender(selectedGender === g ? null : g)}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </FilterChip>
          ))}
        </FilterGroup>

        {/* Filtre Distance + bouton "Près de moi" */}
        <FilterGroup label={userLocation ? 'Distance depuis ma position' : 'Distance depuis Cagny'}>
          {DISTANCE_OPTIONS.map((opt) => (
            <FilterChip
              key={String(opt.value)}
              active={maxDistance === opt.value}
              onClick={() => setMaxDistance(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
          {userLocation ? (
            <button
              onClick={clearGeolocation}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all"
              title="Revenir à la distance depuis Cagny"
            >
              <MapPin className="w-3 h-3" />
              Ma position
              <X className="w-3 h-3 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={requestGeolocation}
              disabled={geoLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-all"
            >
              <MapPin className="w-3 h-3" />
              {geoLoading ? 'Localisation...' : 'Près de moi'}
            </button>
          )}
        </FilterGroup>

        {/* Filtre Période */}
        <FilterGroup label="Période">
          {PERIOD_OPTIONS.map((opt) => (
            <FilterChip
              key={String(opt.value)}
              active={maxDays === opt.value}
              onClick={() => setMaxDays(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </FilterGroup>

        {/* Filtre Jour : semaine vs week-end */}
        <FilterGroup label="Jour">
          {DAY_TYPE_OPTIONS.map((opt) => (
            <FilterChip
              key={String(opt.value)}
              active={dayType === opt.value}
              onClick={() => setDayType(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>

      {/* Compteur de résultats */}
      <div className="text-sm text-muted-foreground">
        {filtered.length} tournoi{filtered.length > 1 ? 's' : ''} trouvé
        {filtered.length > 1 ? 's' : ''}
      </div>

      {/* Grille de cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun tournoi ne correspond à ces critères.</p>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="mt-2 text-sm underline hover:text-foreground"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <TournamentCard key={t.id} tournament={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Sous-composants internes
// ============================================

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        active
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      )}
    >
      {children}
    </button>
  );
}
