// ============================================
// Apple touch icon 180x180 — pour iOS "Ajouter à l'écran d'accueil"
// ============================================
// iOS impose un format spécifique (180x180, sans transparence) qu'on génère
// séparément de l'icône PWA standard.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#059669',
          fontSize: 130,
          lineHeight: 1,
        }}
      >
        🎾
      </div>
    ),
    { ...size }
  );
}
