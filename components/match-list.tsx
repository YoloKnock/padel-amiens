// ============================================
// Liste filtrable des annonces matchmaking — /matchs
// ============================================
// Client component qui prend la liste complète en prop (fetch côté server)
// et gère tous les filtres interactifs.
//
// Filtres dispos :
//   - Recherche texte (pseudo, ville, lieu, niveau, commentaire)
//   - Période : Toutes / Cette semaine / Ce week-end / Ce mois
//   - Niveau (mots-clés) : Tous / Débutant / Intermédiaire / Confirmé / Expert
//   - Ville (dropdown auto-rempli depuis les annonces présentes)
//
// Tri intelligent : si le user est connecté ET a un level dans son profil,
// on met les annonces du MÊME niveau (matching par mot-clé) AU DESSUS,
// puis les autres triées par date. Ça résout le problème "un joueur expert
// se tape la liste des débutants en premier".
//
// La logique de niveau est volontairement simple (mot-clé contains) car
// `level` est un texte libre côté DB. À durcir si on passe à un enum.

'use client';

import { useMemo, useState } from 'react';
import { Filter, MapPin, Search, Target, X } from 'lucide-react';

import { MatchRequestCard } from './match-request-card';
import { cn } from '@/lib/utils';
import type { MatchRequestRow } from '@/app/matchs/page';

interface MatchListProps {
  requests: MatchRequestRow[];
  currentUserId: string | null;
  /** Niveau du user connecté (texte libre du profil). Sert au tri intelligent. */
  currentUserLevel: string | null;
  /** Ville du user connecté — pour pré-sélectionner le filtre ville. */
  currentUserCity: string | null;
}

// ============================================
// Filtres période — ajout du week-end vs cette semaine
// ============================================
type PeriodKey = 'all' | 'weekend' | 'week' | 'month';

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'weekend', label: 'Ce week-end' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
];

// ============================================
// Niveaux supportés pour le filtre + le tri
// ============================================
// Score numérique pour positionner un niveau par rapport aux autres
// (utile pour le tri "proche du mien"). Mots-clés français + FFT.
// Plus c'est petit = plus c'est débutant.
const LEVEL_KEYWORDS: { key: string; label: string; score: number; aliases: string[] }[] = [
  { key: 'debutant', label: 'Débutant', score: 1, aliases: ['débutant', 'debutant', 'debut', 'p25', 'nc'] },
  { key: 'intermediaire', label: 'Intermédiaire', score: 3, aliases: ['intermédiaire', 'intermediaire', 'inter', 'p50', 'p100'] },
  { key: 'confirme', label: 'Confirmé', score: 5, aliases: ['confirmé', 'confirme', 'p250', 'p500'] },
  { key: 'expert', label: 'Expert', score: 7, aliases: ['expert', 'avancé', 'avance', 'p1000', 'p1500', 'p2000'] },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Détecte un score de niveau (1/3/5/7) à partir d'un texte libre.
 *  Renvoie null si aucun mot-clé reconnu. */
function levelScoreOf(text: string | null): number | null {
  if (!text) return null;
  const norm = normalize(text);
  for (const lvl of LEVEL_KEYWORDS) {
    if (lvl.aliases.some((a) => norm.includes(a))) return lvl.score;
  }
  return null;
}

/** Détecte la clé canonique d'un niveau (pour le filtre dropdown). */
function levelKeyOf(text: string | null): string | null {
  if (!text) return null;
  const norm = normalize(text);
  for (const lvl of LEVEL_KEYWORDS) {
    if (lvl.aliases.some((a) => norm.includes(a))) return lvl.key;
  }
  return null;
}

/** Vrai si la date donnée tombe sur samedi ou dimanche prochain
 *  (week-end le plus proche, inclus le jour même si on est déjà we). */
function isUpcomingWeekend(date: Date): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=dim, 6=sam
  // Calcul du samedi de cette semaine (ou aujourd'hui si on est sam/dim)
  const daysToSat = day === 0 ? -1 : 6 - day; // dim -> hier, sinon vers samedi
  const sat = new Date(now);
  sat.setHours(0, 0, 0, 0);
  sat.setDate(sat.getDate() + daysToSat);
  const sun = new Date(sat);
  sun.setDate(sun.getDate() + 1);
  sun.setHours(23, 59, 59, 999);

  return date >= sat && date <= sun;
}

export function MatchList({
  requests,
  currentUserId,
  currentUserLevel,
  currentUserCity,
}: MatchListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  // ============================================
  // Liste unique des villes présentes dans les annonces
  // ============================================
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    for (const r of requests) {
      if (r.profile_city) set.add(r.profile_city);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [requests]);

  // ============================================
  // Score de niveau du user connecté (utilisé pour le tri intelligent)
  // ============================================
  const myLevelScore = useMemo(
    () => levelScoreOf(currentUserLevel),
    [currentUserLevel]
  );

  // ============================================
  // Filtrage + tri
  // ============================================
  const filtered = useMemo(() => {
    const normalizedQuery = normalize(searchQuery.trim());
    const now = new Date();
    const weekCutoff = new Date(now);
    weekCutoff.setHours(23, 59, 59, 999);
    weekCutoff.setDate(weekCutoff.getDate() + 7);
    const monthCutoff = new Date(now);
    monthCutoff.setHours(23, 59, 59, 999);
    monthCutoff.setDate(monthCutoff.getDate() + 30);

    const matches = requests.filter((r) => {
      // Recherche texte libre
      if (normalizedQuery.length > 0) {
        const haystack = normalize(
          `${r.profile_pseudo} ${r.profile_city ?? ''} ${r.profile_level ?? ''} ` +
            `${r.location ?? ''} ${r.level_wanted ?? ''} ${r.comment ?? ''}`
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }

      // Filtre période
      const reqDate = new Date(r.when_date);
      if (period === 'weekend') {
        if (!isUpcomingWeekend(reqDate)) return false;
      } else if (period === 'week') {
        if (reqDate > weekCutoff) return false;
      } else if (period === 'month') {
        if (reqDate > monthCutoff) return false;
      }

      // Filtre niveau : on regarde le niveau de l'annonceur OU ce qu'il cherche
      if (levelFilter !== null) {
        const inAuthor = levelKeyOf(r.profile_level);
        const inWanted = levelKeyOf(r.level_wanted);
        if (inAuthor !== levelFilter && inWanted !== levelFilter) return false;
      }

      // Filtre ville
      if (cityFilter !== null && r.profile_city !== cityFilter) return false;

      return true;
    });

    // Tri intelligent : si on connaît le niveau du user, on bouble en haut
    // les annonces dont le niveau (profil ou recherché) est PROCHE du sien.
    // Distance = |score_annonce - mon_score|. Plus c'est petit, plus c'est top.
    return matches.sort((a, b) => {
      if (myLevelScore !== null) {
        const aScore = levelScoreOf(a.profile_level) ?? levelScoreOf(a.level_wanted);
        const bScore = levelScoreOf(b.profile_level) ?? levelScoreOf(b.level_wanted);
        const aDist = aScore !== null ? Math.abs(aScore - myLevelScore) : 99;
        const bDist = bScore !== null ? Math.abs(bScore - myLevelScore) : 99;
        if (aDist !== bDist) return aDist - bDist;
      }
      // À défaut, tri par date (plus proche d'abord)
      return new Date(a.when_date).getTime() - new Date(b.when_date).getTime();
    });
  }, [requests, searchQuery, period, levelFilter, cityFilter, myLevelScore]);

  const hasFilters =
    searchQuery.trim().length > 0 ||
    period !== 'all' ||
    levelFilter !== null ||
    cityFilter !== null;

  function resetFilters() {
    setSearchQuery('');
    setPeriod('all');
    setLevelFilter(null);
    setCityFilter(null);
  }

  return (
    <div className="space-y-6">
      {/* ============================================
          Barre de filtres
          ============================================ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filtres
            {/* Indicateur subtil si le tri intelligent est actif */}
            {myLevelScore !== null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-normal">
                Tri par proximité de niveau
              </span>
            )}
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

        {/* Recherche libre */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            <Search className="w-3.5 h-3.5" />
            Recherche libre
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ex : Amiens, double, soir..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        {/* Période */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quand
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  period === opt.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Niveau */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Niveau
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLevelFilter(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                levelFilter === null
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              Tous
            </button>
            {LEVEL_KEYWORDS.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setLevelFilter(lvl.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  levelFilter === lvl.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ville (n'apparaît que s'il y a au moins 2 villes pour éviter le
            bruit visuel quand toutes les annonces viennent du même endroit) */}
        {availableCities.length >= 2 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Ville
              {currentUserCity && cityFilter === null && (
                <button
                  onClick={() => setCityFilter(currentUserCity)}
                  className="ml-1 text-emerald-700 hover:text-emerald-800 font-normal normal-case tracking-normal underline-offset-2 hover:underline"
                >
                  proche de {currentUserCity} ?
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCityFilter(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  cityFilter === null
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                Toutes
              </button>
              {availableCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    cityFilter === city
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compteur */}
      <div className="text-sm text-muted-foreground">
        {filtered.length} annonce{filtered.length > 1 ? 's' : ''}
        {hasFilters && requests.length !== filtered.length && (
          <span> sur {requests.length}</span>
        )}
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-muted-foreground">
          Aucune annonce ne correspond à ces critères.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((req, i) => (
            <MatchRequestCard
              key={req.id}
              request={req}
              index={i}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
