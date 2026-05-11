// ============================================
// API Route — CRUD match_requests (annonces matchmaking)
// ============================================
// POST   /api/match-requests             → crée une annonce (auth requise + profil)
// DELETE /api/match-requests?id=<uuid>   → ferme une annonce (statut → 'closed')
//                                          uniquement l'auteur ou un admin

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminUser } from '@/lib/admin';
import { getCurrentUser, isBanned } from '@/lib/user';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const MatchRequestInputSchema = z.object({
  when_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  when_hour: z.string().max(50).nullable().optional(),
  location: z.string().max(80).nullable().optional(),
  level_wanted: z.string().max(50).nullable().optional(),
  comment: z.string().max(500).nullable().optional(),
});

// ============================================
// POST — création d'annonce
// ============================================
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (await isBanned(user.email)) {
    return NextResponse.json({ error: 'Banned' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = MatchRequestInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Vérifie que l'utilisateur a un profil (sinon la FK casse)
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: 'Profil manquant' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('match_requests')
    .insert({
      profile_id: user.id,
      ...parsed.data,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[api/match-requests POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// ============================================
// DELETE — ferme une annonce (auteur OU admin)
// ============================================
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Récupère l'annonce pour vérifier ownership
  const { data: req } = await supabase
    .from('match_requests')
    .select('profile_id')
    .eq('id', id)
    .maybeSingle();

  if (!req) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Autorisation : soit l'auteur, soit un admin (modération)
  const isOwner = req.profile_id === user.id;
  const isAdmin = !!(await getAdminUser());
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // On soft-close plutôt que delete pour pouvoir auditer
  const { error } = await supabase
    .from('match_requests')
    .update({ status: 'closed' })
    .eq('id', id);

  if (error) {
    console.error('[api/match-requests DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
