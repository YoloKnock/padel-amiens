// ============================================
// API Route — CRUD profile utilisateur
// ============================================
// POST   /api/profile  → crée le profile pour l'utilisateur authentifié
// PATCH  /api/profile  → met à jour son propre profile
//
// Pas de DELETE ici — la suppression de compte est une server action sur
// /profil qui supprime aussi l'auth.users en cascade.

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser, isBanned } from '@/lib/user';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const ProfileInputSchema = z.object({
  pseudo: z.string().min(3).max(30),
  level: z.string().max(50).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  contact_phone: z.string().max(20).nullable().optional(),
  is_adult: z.literal(true), // doit être true explicitement
});

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (await isBanned(user.email)) {
    return { user: null, response: NextResponse.json({ error: 'Banned' }, { status: 403 }) };
  }
  return { user, response: null };
}

// ============================================
// POST — création du profile
// ============================================
export async function POST(request: Request) {
  const { user, response: authError } = await requireAuth();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = ProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user!.id,
      ...parsed.data,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[api/profile POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ============================================
// PATCH — mise à jour
// ============================================
const ProfilePatchSchema = ProfileInputSchema.partial();

export async function PATCH(request: Request) {
  const { user, response: authError } = await requireAuth();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = ProfilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user!.id);

  if (error) {
    console.error('[api/profile PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
