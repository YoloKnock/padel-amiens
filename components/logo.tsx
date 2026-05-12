// ============================================
// Logo Padel Amiens — version typographique pure
// ============================================
// Plus d'emoji 🎾 (Hugo l'a explicitement retiré : "fait IA, pas pro").
// On garde juste le texte avec un détail typographique soigné :
//   - "Padel" en font-bold normal
//   - "Amiens" en font-bold avec couleur emerald-600
//   - Petit point coloré en accent (touche d'identité)
// Style "premium minimaliste" type Vercel/Linear : pas d'icône, juste
// une typographie traitée comme un logo.

interface LogoProps {
  /** Taille (par défaut "default" pour le header) */
  size?: 'default' | 'large';
  /** Couleur du texte "Padel" (par défaut foreground) */
  textClassName?: string;
}

export function Logo({ size = 'default', textClassName = '' }: LogoProps) {
  const sizeClasses =
    size === 'large'
      ? 'text-2xl md:text-3xl'
      : 'text-lg sm:text-xl';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold tracking-tight ${sizeClasses} ${textClassName}`}
    >
      <span>Padel</span>
      <span className="text-emerald-600">Amiens</span>
      {/* Point coloré : touche d'identité visuelle, comme la barre verticale
          du logo Stripe ou le point Tremor. Discret mais reconnaissable. */}
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5"
        aria-hidden
      />
    </span>
  );
}
