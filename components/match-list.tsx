// ============================================
// Liste filtrable des annonces matchmaking — /matchs
// ============================================
// Client component qui prend la liste complète en prop (fetch côté server)
// et gère les filtres interactifs : recherche libre, période, niveau, ville.

'use client';

import { useMemo, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';

import { MatchRequestCard } from './match-request-card';
import { cn } from '@/lib/utils';
import type { MatchRequestRow } from '@/app/matchs/page';

interface MatchListProps {
  requests: MatchRequestRow[];
  currentUserId: string | null;
}

// Filtres période identiques à ceux de la home tournois
const PERIOD_OPTIONS = [
  { value: null, label: 'Toutes' },
  { value: 7, label: 'Cette semaine' },
  { value: 30, label: 'Ce mois' },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function MatchList({ requests, currentUserId }: MatchListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDays, setMaxDays] = useState<number | null>(null);

  const periodCutoff = useMemo(() => {
    if (maxDays === null) return null;
    const cutoff = new Date();
    cutoff.setHours(23, 59, 59, 999);
    cutoff.setDate(cutoff.getDate() + maxDays);
    return cutoff;
  }, [maxDays]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(searchQuery.trim());

    return requests.filter((r) => {
      // Recherche textuelle (pseudo, ville profil, lieu, niveau, commentaire)
      if (normalizedQuery.length > 0) {
        const haystack = normalize(
          `${r.profile_pseudo} ${r.profile_city ?? ''} ${r.profile_level ?? ''} ` +
            `${r.location ?? ''} ${r.level_wanted ?? ''} ${r.comment ?? ''}`
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }

      // Filtre période sur when_date
      if (periodCutoff !== null) {
        const reqDate = new Date(r.when_date);
        if (reqDate > periodCutoff) return false;
      }

      return true;
    });
  }, [requests, searchQuery, periodCutoff]);

  const hasFilters = searchQuery.trim().length > 0 || maxDays !== null;

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
              onClick={() => {
                setSearchQuery('');
                setMaxDays(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            <Search className="w-3.5 h-3.5" />
            Recherche (pseudo, ville, niveau, lieu)
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ex : Cagny, P25, débutant..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quand
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => setMaxDays(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  maxDays === opt.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compteur */}
      <div className="text-sm text-muted-foreground">
        {filtered.length} annonce{filtered.length > 1 ? 's' : ''}
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
