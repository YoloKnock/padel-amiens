// ============================================
// API Route — CRUD events admin
// ============================================
// Endpoints :
//   POST   /api/events             → créer un event
//   PATCH  /api/events?id=<uuid>   → mettre à jour (utilisé pour le toggle publish)
//   DELETE /api/events?id=<uuid>   → supprimer
//
// Chaque endpoint vérifie l'authentification admin AVANT d'agir. On utilise
// le client admin (service_role) pour bypass la RLS et pouvoir insérer/
// modifier des events draft (que la RLS publique cache).

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminUser } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase';
import { EventInputSchema, EVENT_STATUSES } from '@/types/event';

export const runtime = 'nodejs';

// ============================================
// Helper : check admin OU 401
// ============================================
async function requireAuth() {
  const user = await getAdminUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, response: null };
}

// ============================================
// POST — Création
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

  const parsed = EventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...parsed.data,
      created_by: user!.id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[api/events POST] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// ============================================
// PATCH — Mise à jour (status uniquement pour l'instant)
// ============================================
// On garde l'API minimaliste : seul le champ `status` est patchable depuis
// l'UI (toggle publish). Si on veut éditer le contenu plus tard, on étendra
// le schéma de patch.
const PatchSchema = z.object({
  status: z.enum(EVENT_STATUSES).optional(),
});

export async function PATCH(request: Request) {
  const { response: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Rien à patcher → 400 plutôt que de toucher la DB pour rien
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('events').update(parsed.data).eq('id', id);

  if (error) {
    console.error('[api/events PATCH] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ============================================
// DELETE — Suppression définitive
// ============================================
// Pas de soft-delete pour le MVP : on a déjà le statut 'archived' si on veut
// "cacher sans supprimer". DELETE = vraiment supprimer la ligne.
export async function DELETE(request: Request) {
  const { response: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    console.error('[api/events DELETE] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
