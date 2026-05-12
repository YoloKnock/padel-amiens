// ============================================
// Illustration SVG : court de padel vu en perspective
// ============================================
// Vue 3/4 du court de padel avec ses vitres caractéristiques, le filet
// central, les lignes de service. Stylisé en lignes (style "blueprint")
// + remplissage discret pour rester lisible. Impossible de le confondre
// avec un autre sport — c'est dessiné comme un padel.
//
// Inspiration : illustrations Linear / Stripe / Vercel. Look "blueprint
// technique" qui suggère le sport sans tomber dans le réalisme photo.

interface PadelCourtIllustrationProps {
  className?: string;
}

export function PadelCourtIllustration({ className }: PadelCourtIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        {/* Dégradés pour le sol et l'ambiance */}
        <linearGradient id="court-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="court-glass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* ============================================
          Vue 3/4 — le court avec sa perspective
          ============================================ */}

      {/* Sol du court (rectangle en perspective trapézoïdale) */}
      <path
        d="M 60 400 L 340 400 L 300 220 L 100 220 Z"
        fill="url(#court-floor)"
        stroke="#059669"
        strokeWidth="2"
      />

      {/* Lignes de jeu — ligne de service (parallèle aux côtés) */}
      <path
        d="M 100 220 L 60 400 M 300 220 L 340 400"
        stroke="#fff"
        strokeWidth="1.5"
        strokeDasharray="0"
        opacity="0.7"
      />
      {/* Ligne médiane verticale (séparation des carrés de service) */}
      <line
        x1="200"
        y1="220"
        x2="200"
        y2="400"
        stroke="#fff"
        strokeWidth="1.5"
        opacity="0.6"
        strokeDasharray="4 4"
      />
      {/* Ligne de service horizontale */}
      <line
        x1="115"
        y1="290"
        x2="285"
        y2="290"
        stroke="#fff"
        strokeWidth="1.5"
        opacity="0.7"
      />

      {/* ============================================
          Vitres latérales + de fond (caractéristiques du padel)
          ============================================ */}

      {/* Vitre du fond — rectangle bleu transparent */}
      <path
        d="M 100 220 L 100 100 L 300 100 L 300 220 Z"
        fill="url(#court-glass)"
        stroke="#06b6d4"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Vitres latérales — trapézoïdes en perspective */}
      <path
        d="M 100 220 L 60 400 L 60 280 L 100 100 Z"
        fill="url(#court-glass)"
        stroke="#06b6d4"
        strokeWidth="2"
        opacity="0.6"
      />
      <path
        d="M 300 220 L 340 400 L 340 280 L 300 100 Z"
        fill="url(#court-glass)"
        stroke="#06b6d4"
        strokeWidth="2"
        opacity="0.6"
      />

      {/* Lignes verticales décoratives sur la vitre du fond (cadres métalliques) */}
      <line x1="150" y1="100" x2="150" y2="220" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
      <line x1="200" y1="100" x2="200" y2="220" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
      <line x1="250" y1="100" x2="250" y2="220" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />

      {/* ============================================
          Filet central
          ============================================ */}
      <line
        x1="40"
        y1="310"
        x2="360"
        y2="310"
        stroke="#475569"
        strokeWidth="3"
      />
      {/* Mailles du filet — trait pointillé */}
      <line
        x1="40"
        y1="316"
        x2="360"
        y2="316"
        stroke="#475569"
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.6"
      />
      {/* Poteaux du filet */}
      <line x1="40" y1="290" x2="40" y2="320" stroke="#475569" strokeWidth="3" />
      <line x1="360" y1="290" x2="360" y2="320" stroke="#475569" strokeWidth="3" />

      {/* ============================================
          Balle de padel (jaune fluo, suspendue en l'air)
          ============================================ */}
      <circle cx="265" cy="170" r="8" fill="#fde047" stroke="#facc15" strokeWidth="1.5" />
      {/* Lignes courbes de la balle */}
      <path
        d="M 257 170 Q 265 165 273 170"
        stroke="#facc15"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
      {/* Traînée de mouvement (lignes de vitesse) */}
      <line x1="248" y1="160" x2="240" y2="150" stroke="#fde047" strokeWidth="1.5" opacity="0.5" />
      <line x1="252" y1="167" x2="244" y2="162" stroke="#fde047" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
