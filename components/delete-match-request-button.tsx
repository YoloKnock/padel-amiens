// ============================================
// Bouton "Retirer mon annonce" — client component
// ============================================
// Réutilisable depuis /matchs/[id] (page détail) et /profil (liste perso).
// Utilise l'API DELETE /api/match-requests qui vérifie l'auth + ownership
// côté serveur, donc pas de risque qu'un user supprime celle d'un autre.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  requestId: string;
  /** Variant visuel : full = gros bouton rouge, inline = lien discret */
  variant?: 'full' | 'inline';
  /** Où rediriger après suppression. Par défaut, refresh la page courante. */
  redirectTo?: string;
}

export function DeleteMatchRequestButton({
  requestId,
  variant = 'full',
  redirectTo,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!confirm('Retirer définitivement cette annonce ?')) return;

    setDeleting(true);
    const response = await fetch(`/api/match-requests?id=${requestId}`, {
      method: 'DELETE',
    });
    setDeleting(false);

    if (!response.ok) {
      toast.error('Suppression échouée');
      return;
    }
    toast.success('Annonce retirée');

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={deleting}
        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Retirer
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
    >
      <Trash2 className="w-4 h-4" />
      {deleting ? 'Suppression...' : 'Retirer mon annonce'}
    </button>
  );
}
