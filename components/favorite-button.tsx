// ============================================
// FavoriteButton — bouton coeur sur les cards tournois
// ============================================
// Toggle ★ filled vs ☆ outline avec animation au click. Optimistic
// update via le hook useFavorites — l'UI réagit instantanément, et
// rollback si l'API échoue.
//
// Si le user n'est PAS connecté, le clic redirige vers /login avec un
// next= qui ramène à la page courante. Pas de modal/toast intrusif.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  tournamentId: string;
  /** Si fourni, on saute le check côté hook (pré-rendu serveur). */
  isLoggedIn?: boolean;
  /** Taille : "sm" pour les listes, "md" pour la fiche détail */
  size?: 'sm' | 'md';
  /** Style du bouton :
   *   - "icon"  : juste le coeur (par défaut, pour les cards)
   *   - "label" : coeur + texte "Favori" (pour la fiche détail) */
  variant?: 'icon' | 'label';
  className?: string;
}

export function FavoriteButton({
  tournamentId,
  isLoggedIn = true,
  size = 'sm',
  variant = 'icon',
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const { ready, toggle, isFavorite } = useFavorites();
  const [pending, setPending] = useState(false);

  const favorited = isFavorite(tournamentId);

  async function handleClick(e: React.MouseEvent) {
    // CRITIQUE : la card parente a souvent un stretched Link en absolute
    // inset-0. Sans stopPropagation + preventDefault, un clic sur le coeur
    // déclenche aussi la navigation vers /tournoi/[id].
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      // Pas de modal lourde — redirection propre avec retour automatique
      toast.info('Connecte-toi pour ajouter aux favoris');
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    if (pending) return;
    setPending(true);

    try {
      const nowFavorite = await toggle(tournamentId);
      toast.success(
        nowFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris',
        { duration: 1500 }
      );
    } catch {
      toast.error('Erreur — réessaie dans un instant');
    } finally {
      setPending(false);
    }
  }

  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  // Variante "label" : pill avec texte
  if (variant === 'label') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={favorited}
        aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={cn(
          'relative z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
          favorited
            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-700',
          pending && 'opacity-60 cursor-wait',
          className
        )}
      >
        <motion.span
          animate={{ scale: favorited ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex"
        >
          <Heart
            className={cn(iconSize, favorited && 'fill-rose-500 text-rose-500')}
          />
        </motion.span>
        {favorited ? 'Favori' : 'Ajouter aux favoris'}
      </button>
    );
  }

  // Variante "icon" (par défaut) : juste le coeur, look discret
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || !ready}
      aria-pressed={favorited}
      aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cn(
        'relative z-10 inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 transition-all hover:scale-110',
        favorited && 'border-rose-200 bg-rose-50',
        pending && 'opacity-60 cursor-wait',
        sizeClasses,
        className
      )}
    >
      <motion.span
        animate={{ scale: favorited ? [1, 1.4, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="inline-flex"
      >
        <Heart
          className={cn(
            iconSize,
            favorited
              ? 'fill-rose-500 text-rose-500'
              : 'text-slate-400 hover:text-rose-500 transition-colors'
          )}
        />
      </motion.span>
    </button>
  );
}
