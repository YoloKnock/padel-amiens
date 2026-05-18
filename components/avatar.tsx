// ============================================
// Avatar — composant réutilisable de photo de profil
// ============================================
// Affiche la photo de l'utilisateur si dispo, sinon ses initiales sur un
// fond emerald pour cohérence avec le brand. Utilisé dans :
//   - Header (avatar du user connecté)
//   - match-request-card (avatar de l'auteur de l'annonce)
//   - /joueur/[pseudo] (avatar grand format)
//   - /messages (avatar du destinataire dans la liste)

import { cn } from '@/lib/utils';

interface AvatarProps {
  /** URL publique de l'avatar (Supabase Storage). Null = fallback initiale. */
  url?: string | null;
  /** Pseudo ou email — utilisé pour générer l'initiale du fallback. */
  name?: string | null;
  /** Tailles prédéfinies pour cohérence visuelle entre les écrans */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export function Avatar({ url, name, size = 'md', className }: AvatarProps) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-emerald-100 text-emerald-700 font-bold',
        SIZE_CLASSES[size],
        className
      )}
    >
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  );
}
