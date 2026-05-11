// ============================================
// API Route — fichier .ics pour un tournoi
// ============================================
// GET /api/ics/tournoi/<uuid> → retourne un text/calendar attaché.
// Cliquer sur ce lien depuis un téléphone ouvre directement l'app
// calendrier avec l'événement pré-rempli.

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NextResponse } from 'next/server';

import { buildIcs } from '@/lib/ics';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const revalidate = 3600; // ICS peut être caché 1h (le tournoi bouge peu)

const GENDER_LABELS: Record<string, string> = {
  messieurs: 'Messieurs',
  dames: 'Dames',
  mixte: 'Mixte',
};

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  // Validation UUID basique (anti-scan)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('upcoming_tournaments')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Compose la description avec les infos pratiques + lien vers notre fiche
  const gender = GENDER_LABELS[data.gender] ?? data.gender;
  const dateLabel = format(parseISO(data.start_date), 'EEEE d MMMM yyyy', { locale: fr });
  const lines: string[] = [
    `${data.category} ${gender}`,
    dateLabel,
  ];
  if (data.club_name) {
    lines.push(`Club : ${data.club_name}${data.club_city ? ` (${data.club_city})` : ''}`);
  }
  if (data.referee) lines.push(`Juge-arbitre : ${data.referee}`);
  if (data.registration_url) lines.push(`Inscription : ${data.registration_url}`);
  lines.push('', `Détails : https://padel-amiens.fr/tournoi/${data.id}`);

  const ics = buildIcs({
    uid: data.id,
    title: data.title,
    description: lines.join('\n'),
    startDate: data.start_date,
    endDate: data.end_date,
    location: [data.club_name, data.club_city].filter(Boolean).join(', '),
    url: `https://padel-amiens.fr/tournoi/${data.id}`,
  });

  // Filename suggéré au navigateur ; le slug rend le fichier reconnaissable
  // dans les téléchargements de l'utilisateur.
  const filename = `padel-${data.category.toLowerCase()}-${data.start_date}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // 1h de cache navigateur, mais on n'a aucune raison de pousser plus loin
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
