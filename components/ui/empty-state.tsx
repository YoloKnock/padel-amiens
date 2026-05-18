// ============================================
// EmptyState — vide soigné pour les listings sans résultat
// ============================================
// Bien meilleur que le "Aucun résultat" en texte gris : icône colorée,
// titre, description optionnelle, et CTA si action utile possible.
// S'utilise dans les pages avec filtres (/matchs, /tournois, /jouer) et
// les premières utilisations (annonces vides, favoris vides, etc.).

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icône lucide affichée en grand (cercle emerald clair de fond) */
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Action principale : un lien ou un bouton */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Action secondaire (lien discret sous le bouton principal) */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Variante visuelle : "muted" (plus discret, sur les listings filtrés)
   *  ou "card" (gros bloc, sur les "ton premier X"). Par défaut "muted". */
  variant?: 'muted' | 'card';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'muted',
  className,
}: EmptyStateProps) {
  const wrapperClass =
    variant === 'card'
      ? 'bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center'
      : 'bg-white rounded-xl border border-slate-200 p-8 text-center';

  return (
    <div className={cn(wrapperClass, className)}>
      {/* Cercle décoratif autour de l'icône — beaucoup plus engageant
          qu'une icône nue. Le gradient soft est cohérent avec le hero
          et les fallbacks d'images de clubs. */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 mb-4">
        <Icon className="w-8 h-8 text-emerald-600" aria-hidden />
      </div>

      <h3 className="font-semibold text-base md:text-lg mb-1.5">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
          {description}
        </p>
      )}

      {action && (
        <div className="inline-flex flex-col items-center gap-2">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
            >
              {action.label}
            </button>
          )}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {secondaryAction.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
