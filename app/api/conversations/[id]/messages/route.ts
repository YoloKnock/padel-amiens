// ============================================
// API Messages d'une conversation
// ============================================
// GET  /api/conversations/[id]/messages           → liste les messages
//                                                  (tri ASC pour affichage chat)
// POST /api/conversations/[id]/messages { body }  → envoie un message
//                                                  + déclenche le trigger qui
//                                                  bump last_message_at
//
// Toutes les routes vérifient que le user fait partie de la conversation.
// (La RLS le ferait aussi, mais on retourne des erreurs plus parlantes.)

import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';
import { SendMessageInputSchema } from '@/types/message';

export const runtime = 'nodejs';

interface RouteContext {
  params: { id: string };
}

/** Vérifie que l'user fait partie de la conversation. Renvoie la conv ou null. */
async function assertMember(userId: string, conversationId: string) {
  // Validation UUID basique pour éviter une requête DB pour rien
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
    return null;
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b')
    .eq('id', conversationId)
    .maybeSingle();
  if (!data) return null;
  if (data.participant_a !== userId && data.participant_b !== userId) {
    return null;
  }
  return data;
}

// ============================================
// GET — liste les messages d'une conversation
// ============================================
// On en profite pour marquer comme lus tous les messages reçus dans cette
// conversation (read_at = NOW() pour les messages où sender_id != user.id
// et read_at IS NULL). Ça décrémente le badge non-lus instantanément.
export async function GET(_request: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conv = await assertMember(user.id, ctx.params.id);
  if (!conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = createAdminClient();

  // 1) Fetch messages (tri ASC = du plus ancien au plus récent)
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) {
    console.error('[messages GET]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // 2) Marquer les messages reçus comme lus en arrière-plan
  //    On ignore les erreurs : c'est cosmétique (badge non-lus)
  void supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conv.id)
    .neq('sender_id', user.id)
    .is('read_at', null)
    .then(({ error: updErr }) => {
      if (updErr) console.warn('[messages GET] mark-read failed:', updErr);
    });

  // Renvoie aussi les infos de l'autre participant — pratique pour le titre
  // de la page de chat sans avoir à refaire un autre fetch côté client.
  const otherId =
    conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
  const { data: other } = await supabase
    .from('profiles')
    .select('id, pseudo, avatar_url, city, level')
    .eq('id', otherId)
    .maybeSingle();

  return NextResponse.json({
    messages: data ?? [],
    other: other ?? {
      id: otherId,
      pseudo: 'Joueur inconnu',
      avatar_url: null,
      city: null,
      level: null,
    },
  });
}

// ============================================
// POST — envoie un message
// ============================================
export async function POST(request: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conv = await assertMember(user.id, ctx.params.id);
  if (!conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SendMessageInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: created, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conv.id,
      sender_id: user.id,
      body: parsed.data.body,
    })
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .single();

  if (error || !created) {
    console.error('[messages POST]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ message: created });
}
