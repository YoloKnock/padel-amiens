// ============================================
// Open Graph image dynamique pour /tournoi/[id]
// ============================================
// Next.js détecte ce fichier et génère automatiquement une image 1200x630
// pour chaque tournoi. C'est cette image qui s'affiche en preview quand on
// partage un lien sur Discord, WhatsApp, Twitter, etc.
//
// Doc : https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
//
// Pour rester simple : layout texte uniquement (titre + date + club), pas
// d'images externes (qui demanderaient un fetch supplémentaire au build),
// pas de fonts custom (qui demanderaient un buffer Google Fonts).

import { ImageResponse } from 'next/og';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { createAdminClient } from '@/lib/supabase';
import type { TournamentWithClub } from '@/types/tournament';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface ImageProps {
  params: { id: string };
}

const GENDER_LABELS: Record<string, string> = {
  messieurs: 'Messieurs',
  dames: 'Dames',
  mixte: 'Mixte',
};

export default async function OpengraphImage({ params }: ImageProps) {
  // On utilise le client admin pour rester cohérent avec la page elle-même
  // (qui bypass la RLS via service_role). Si la requête échoue, on rend
  // quand même une image par défaut plutôt que 500.
  let tournament: TournamentWithClub | null = null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('upcoming_tournaments')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();
    tournament = data;
  } catch {
    // ignoré : on rend une image générique
  }

  const title = tournament?.title ?? 'Tournoi padel';
  const category = tournament?.category ?? 'Padel';
  const gender = tournament ? GENDER_LABELS[tournament.gender] ?? tournament.gender : '';
  const dateLabel = tournament
    ? format(parseISO(tournament.start_date), 'EEEE d MMMM yyyy', { locale: fr })
    : '';
  const clubLabel = tournament?.club_name ?? '';
  const cityLabel = tournament?.club_city ?? '';

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
        {/* Header : marque */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 50 }}>🎾</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#0f172a' }}>
            Padel Amiens
          </div>
        </div>

        {/* Corps : badges + titre + détails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 600,
                padding: '8px 18px',
                borderRadius: 8,
                background: '#059669',
                color: '#ffffff',
              }}
            >
              {category}
            </span>
            {gender && (
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: '#f1f5f9',
                  color: '#334155',
                }}
              >
                {gender}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 30,
              color: '#475569',
              textTransform: 'capitalize',
            }}
          >
            <div>{dateLabel}</div>
            {clubLabel && (
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {clubLabel}
                {cityLabel && (
                  <span style={{ fontWeight: 400, color: '#64748b' }}>
                    {' '}
                    · {cityLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer : URL */}
        <div style={{ fontSize: 22, color: '#64748b' }}>padel-amiens.fr</div>
      </div>
    ),
    {
      ...size,
    }
  );
}
