// ============================================
// Bouton "Retirer mon annonce" — client component
// ============================================
// Réutilisable depuis /matchs/[id] (page détail) et /profil (liste perso).
// Utilise l'API DELETE /api/match-requests qui vérifie l'auth + ownership
// côté serveur, donc pas de risque qu'un user supprime celle d'un autre.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  requestId: string;
  /** Variant visuel : full = gros bouton rouge, inline = lien discret */
  variant?: 'full' | 'inline';
  /** Où rediriger après suppression. Par défaut, refresh la page courante. */
  redirectTo?: string;
  /** Mode "trouvé" : appelle l'API avec status=closed_found au lieu de
   *  closed. UI différente (vert "Marquer trouvé" au lieu de rouge "Retirer"). */
  mode?: 'remove' | 'found';
}

export function DeleteMatchRequestButton({
  requestId,
  variant = 'full',
  redirectTo,
  mode = 'remove',
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    const confirmMsg =
      mode === 'found'
        ? 'Marquer cette annonce comme « partenaire trouvé » ? Elle ne sera plus visible.'
        : 'Retirer définitivement cette annonce ?';
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    const params = mode === 'found' ? `?id=${requestId}&status=closed_found` : `?id=${requestId}`;
    const response = await fetch(`/api/match-requests${params}`, {
      method: 'DELETE',
    });
    setDeleting(false);

    if (!response.ok) {
      toast.error(mode === 'found' ? 'Mise à jour échouée' : 'Suppression échouée');
      return;
    }
    toast.success(mode === 'found' ? 'Bonne partie 🎾 !' : 'Annonce retirée');

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  // Style + libellé selon le mode (couleurs vert pour "trouvé", rouge pour retirer)
  const isFound = mode === 'found';
  const Icon = isFound ? CheckCircle2 : Trash2;
  const fullLabel = isFound ? 'J\'ai trouvé un partenaire' : 'Retirer mon annonce';
  const inlineLabel = isFound ? 'Trouvé' : 'Retirer';

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={deleting}
        className={
          isFound
            ? 'inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 disabled:opacity-50 transition-colors'
            : 'inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors'
        }
      >
        <Icon className="w-3 h-3" />
        {inlineLabel}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      className={
        isFound
          ? 'inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-50 transition-colors text-sm'
          : 'inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50 transition-colors text-sm'
      }
    >
      <Icon className="w-4 h-4" />
      {deleting ? '...' : fullLabel}
    </button>
  );
}
