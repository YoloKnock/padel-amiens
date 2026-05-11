// ============================================
// Icône PWA 512x512 générée dynamiquement
// ============================================
// Background emerald + emoji 🎾. Pas de fichier PNG à committer, Next.js
// la génère à la volée via ImageResponse comme pour les OG images.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#059669', // emerald-600
          fontSize: 360,
          lineHeight: 1,
        }}
      >
        🎾
      </div>
    ),
    { ...size }
  );
}
