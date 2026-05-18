// ============================================
// API Route — Favoris tournois
// ============================================
// GET    /api/favorites                    → liste des IDs tournois favoris
//                                            de l'utilisateur connecté
// POST   /api/favorites { tournament_id }  → ajoute un favori
// DELETE /api/favorites?tournament_id=X    → retire un favori
//
// Toutes les routes requièrent une session. Les politiques RLS sur la
// table `tournament_favorites` empêchent déjà un user de lire/écrire les
// favoris d'un autre, mais on double avec un check côté API pour des
// erreurs plus parlantes (401 plutôt que 0 lignes affectées).

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';

export const runtime = 'nodejs';

const InputSchema = z.object({
  tournament_id: z.string().uuid('UUID tournoi invalide'),
});

// ============================================
// GET — liste des IDs favoris du user
// ============================================
// Renvoie un objet { ids: string[] } plutôt qu'un array nu pour pouvoir
// étendre le format plus tard (pagination, dates, etc.) sans breaking change.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ids: [] }, { status: 200 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tournament_favorites')
    .select('tournament_id')
    .eq('user_id', user.id);

  if (error) {
    console.error('[api/favorites GET]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({
    ids: (data ?? []).map((row) => row.tournament_id),
  });
}

// ============================================
// POST — ajoute un favori
// ============================================
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  // upsert idempotent : un re-clic sur le coeur ne pète pas même si le
  // favori existe déjà côté DB (course condition possible client-side).
  const { error } = await supabase
    .from('tournament_favorites')
    .upsert(
      {
        user_id: user.id,
        tournament_id: parsed.data.tournament_id,
      },
      { onConflict: 'user_id,tournament_id' }
    );

  if (error) {
    console.error('[api/favorites POST]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ============================================
// DELETE — retire un favori
// ============================================
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournament_id');
  const parsed = InputSchema.safeParse({ tournament_id: tournamentId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'tournament_id requis (UUID)' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('tournament_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('tournament_id', parsed.data.tournament_id);

  if (error) {
    console.error('[api/favorites DELETE]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
