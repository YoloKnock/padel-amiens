// ============================================
// Open Graph image dynamique pour /club/[id]
// ============================================
// Identique en structure à /tournoi/[id]/opengraph-image.tsx, mais montre
// le club, sa ville et un teaser des prochains tournois.

import { ImageResponse } from 'next/og';

import { createAdminClient } from '@/lib/supabase';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface ImageProps {
  params: { id: string };
}

export default async function OpengraphImage({ params }: ImageProps) {
  let clubName = 'Centre de padel';
  let clubCity: string | null = null;
  let tournamentCount = 0;

  try {
    const supabase = createAdminClient();
    const [{ data: club }, { count }] = await Promise.all([
      supabase.from('clubs').select('name, city').eq('id', params.id).maybeSingle(),
      supabase
        .from('upcoming_tournaments')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', params.id),
    ]);
    if (club) {
      clubName = club.name;
      clubCity = club.city;
    }
    tournamentCount = count ?? 0;
  } catch {
    // image générique en cas d'erreur DB
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #f0fdfa 100%)',
          padding: '60px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 50 }}>🎾</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#0f172a' }}>
            Padel Amiens
          </div>
        </div>

        {/* Corps : nom du club, ville, nb tournois à venir */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 8,
              background: '#059669',
              color: '#ffffff',
              alignSelf: 'flex-start',
            }}
          >
            Centre de padel
          </span>

          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            {clubName}
          </div>

          {clubCity && (
            <div style={{ fontSize: 36, color: '#475569' }}>📍 {clubCity}</div>
          )}

          {tournamentCount > 0 && (
            <div style={{ fontSize: 28, color: '#059669', fontWeight: 600 }}>
              {tournamentCount} tournoi{tournamentCount > 1 ? 's' : ''} à venir
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ fontSize: 22, color: '#64748b' }}>padel-amiens.fr</div>
      </div>
    ),
    { ...size }
  );
}
