// ============================================
// Composant Liste de tournois avec filtres
// ============================================
// Client component qui gère les filtres interactifs.
// Reçoit la liste complète depuis le server component (pas de fetch côté client).

'use client';

import { useMemo, useState } from 'react';
import { Filter, X } from 'lucide-react';

import { TournamentCard } from './tournament-card';
import { CATEGORIES, GENDERS } from '@/types/tournament';
import type { TournamentWithClub } from '@/types/tournament';
import { cn } from '@/lib/utils';

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

export function TournamentList({ tournaments }: TournamentListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);

  // Filtrage mémoïsé pour éviter de recalculer à chaque render
  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedGender && t.gender !== selectedGender) return false;
      if (maxDistance !== null && t.distance_km !== null && t.distance_km > maxDistance) {
        return false;
      }
      return true;
    });
  }, [tournaments, selectedCategory, selectedGender, maxDistance]);

  const hasFilters = selectedCategory || selectedGender || maxDistance !== null;

  function resetFilters() {
    setSelectedCategory(null);
    setSelectedGender(null);
    setMaxDistance(null);
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

        {/* Filtre Distance */}
        <FilterGroup label="Distance depuis Cagny">
          {DISTANCE_OPTIONS.map((opt) => (
            <FilterChip
              key={String(opt.value)}
              active={maxDistance === opt.value}
              onClick={() => setMaxDistance(opt.value)}
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
