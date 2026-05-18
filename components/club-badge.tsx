// ============================================
// ClubBadge — vignette logo + nom du club
// ============================================
// Petit composant réutilisable affiché dans toutes les listes (tournois,
// events, /jouer, fiche club). Évite de ré-écrire 4 fois la même logique :
//
//   [LOGO 32px] Tennis Club Amiens Métropole
//                Amiens · 3 km
//
// Hiérarchie de fallback :
//   1) logo_url  -> petit carré (object-contain, fond clair)
//   2) icône MapPin générique sur fond emerald clair
//
// La cover_image_url n'est PAS utilisée ici (trop "photo de complexe"
// pour un thumb 32px, on perdrait toute lisibilité).

import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ClubBadgeProps {
  clubId?: string | null;
  name: string | null;
  city?: string | null;
  logoUrl?: string | null;
  /** km depuis la position user (null si on ne sait pas) */
  distanceKm?: number | null;
  /** Taille du logo (par défaut "md" = 36px) */
  size?: 'sm' | 'md';
  /** Si true, le badge est cliquable vers /club/[id]. Désactivé par défaut
   *  pour éviter un Link imbriqué dans un autre Link (warning React). */
  clickable?: boolean;
  className?: string;
}

export function ClubBadge({
  clubId,
  name,
  city,
  logoUrl,
  distanceKm,
  size = 'md',
  clickable = false,
  className,
}: ClubBadgeProps) {
  if (!name) return null;

  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7'
      : 'w-9 h-9';

  const inner = (
    <div className={cn('flex items-start gap-2.5 min-w-0', className)}>
      {/* Mini-thumb : logo si dispo, sinon pin */}
      <div
        className={cn(
          'flex-shrink-0 rounded-md bg-gradient-to-br from-emerald-50 to-teal-100 border border-slate-200 overflow-hidden flex items-center justify-center',
          sizeClasses
        )}
      >
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt=""
            className="w-full h-full object-contain p-0.5"
            loading="lazy"
          />
        ) : (
          <MapPin
            className="w-3.5 h-3.5 text-emerald-600/50"
            aria-hidden
          />
        )}
      </div>

      {/* Nom + ville/distance */}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm text-foreground truncate">
          {name}
        </div>
        {(city || distanceKm !== null) && (
          <div className="text-xs text-muted-foreground truncate">
            {city}
            {city && distanceKm !== null && distanceKm !== undefined ? ' · ' : ''}
            {distanceKm !== null && distanceKm !== undefined
              ? `${distanceKm} km`
              : ''}
          </div>
        )}
      </div>
    </div>
  );

  // Si clickable + on a un ID, on enrobe dans un Link interne. Sinon on
  // retourne juste le div (utile quand le ClubBadge est DÉJÀ dans une card
  // cliquable type tournament-card avec stretched link).
  if (clickable && clubId) {
    return (
      <Link
        href={`/club/${clubId}`}
        className="block relative z-10 hover:opacity-80 transition-opacity"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
