// ============================================
// Open Graph image par défaut (racine du layout)
// ============================================
// Sert pour la home et toutes les pages qui n'ont pas leur propre opengraph-image
// (mentions légales, /jouer, /a-propos, etc.).

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Padel Amiens — Tous les tournois padel autour d\'Amiens';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #f0fdfa 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px 80px',
          textAlign: 'center',
        }}
      >
        {/* Logo + marque */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 30 }}>
          <div style={{ fontSize: 80 }}>🎾</div>
          <div style={{ fontSize: 50, fontWeight: 700, color: '#0f172a' }}>
            Padel Amiens
          </div>
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.1,
            maxWidth: '1000px',
            marginBottom: 24,
          }}
        >
          Tous les tournois padel
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            background: 'linear-gradient(to right, #059669, #0d9488)',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.1,
            marginBottom: 40,
          }}
        >
          autour d&apos;Amiens
        </div>

        <div style={{ fontSize: 28, color: '#475569', maxWidth: '900px' }}>
          Calendrier FFT, Americano, créneaux de réservation — agrégés et filtrés localement.
        </div>
      </div>
    ),
    { ...size }
  );
}
