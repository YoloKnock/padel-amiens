// ============================================
// Skeleton — placeholder animé pendant le chargement
// ============================================
// Composant primitif inspiré de shadcn/ui : un simple <div> qui pulse en
// fond gris pour suggérer du contenu à venir. Sert à éviter le "flash
// blanc" pendant les loading async côté client.

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-busy
      aria-live="polite"
      className={cn(
        'animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/60',
        className
      )}
      {...props}
    />
  );
}

// ============================================
// SkeletonCard — placeholder pour une card de tournoi/match/event
// ============================================
// Forme générique qui imite la structure visuelle de nos cards (bandeau
// haut + 3 lignes de texte + CTA bas). Évite à chaque composant de
// recoder ses placeholders.
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
      <Skeleton className="h-14 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="h-9 w-full mt-3" />
      </div>
    </div>
  );
}

// ============================================
// SkeletonList — répète SkeletonCard sur une grille
// ============================================
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
