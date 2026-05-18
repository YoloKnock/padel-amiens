// ============================================
// API Conversations — liste + création
// ============================================
// GET  /api/conversations             → liste de mes conversations
//                                       (triées last_message_at DESC)
// POST /api/conversations { recipient_id }
//                                     → crée la conversation si elle n'existe
//                                       pas encore, sinon la récupère
//                                       (idempotent). Renvoie l'ID dans
//                                       les 2 cas.
//
// Contrainte DB : participant_a < participant_b. On trie côté code avant
// d'insérer pour respecter le check constraint.

import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';
import { CreateConversationInputSchema } from '@/types/message';

export const runtime = 'nodejs';

/** Helper : trie 2 UUIDs en ordre lexicographique pour la contrainte. */
function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// ============================================
// GET — liste de mes conversations avec preview + unread
// ============================================
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1) Mes conversations (triées par dernier message)
  const { data: convs, error: convsErr } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b, last_message_at')
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false })
    .limit(200);

  if (convsErr) {
    console.error('[conversations GET]', convsErr);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const conversations = convs ?? [];
  if (conversations.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  // 2) Pour chaque conv : récupérer le dernier message + non lus
  //    On batch les 2 fetchs en parallèle.
  const convIds = conversations.map((c) => c.id);
  const otherIds = conversations.map((c) =>
    c.participant_a === user.id ? c.participant_b : c.participant_a
  );

  const [
    { data: lastMessages },
    { data: otherProfiles },
    { data: unreadRows },
  ] = await Promise.all([
    // Derniers messages : on fait UNE seule requête pour toutes les convs
    // et on garde le plus récent par conversation côté code.
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false }),
    // Profils des "autres" : un seul SELECT en lot
    supabase
      .from('profiles')
      .select('id, pseudo, avatar_url, city, level')
      .in('id', otherIds),
    // Comptage des non-lus par conversation pour moi
    supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .is('read_at', null),
  ]);

  // Map des derniers messages par conv (le 1er trouvé est le plus récent grâce au tri DESC)
  const lastByConv = new Map<
    string,
    { id: string; sender_id: string; body: string; created_at: string; read_at: string | null }
  >();
  for (const m of lastMessages ?? []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, m);
    }
  }

  const profilesById = new Map<
    string,
    { id: string; pseudo: string; avatar_url: string | null; city: string | null; level: string | null }
  >();
  for (const p of otherProfiles ?? []) {
    profilesById.set(p.id, p);
  }

  const unreadByConv = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    unreadByConv.set(
      row.conversation_id,
      (unreadByConv.get(row.conversation_id) ?? 0) + 1
    );
  }

  const result = conversations.map((c) => {
    const otherId =
      c.participant_a === user.id ? c.participant_b : c.participant_a;
    const other = profilesById.get(otherId);
    const last = lastByConv.get(c.id);
    return {
      id: c.id,
      other: other
        ? {
            id: other.id,
            pseudo: other.pseudo,
            avatar_url: other.avatar_url,
            city: other.city,
            level: other.level,
          }
        : {
            id: otherId,
            pseudo: 'Joueur inconnu',
            avatar_url: null,
            city: null,
            level: null,
          },
      last_message: last
        ? {
            body: last.body,
            sender_id: last.sender_id,
            created_at: last.created_at,
            read_at: last.read_at,
          }
        : null,
      last_message_at: c.last_message_at,
      unread_count: unreadByConv.get(c.id) ?? 0,
    };
  });

  return NextResponse.json({ conversations: result });
}

// ============================================
// POST — crée ou récupère une conversation avec un user donné
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

  const parsed = CreateConversationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  if (parsed.data.recipient_id === user.id) {
    return NextResponse.json(
      { error: 'Tu ne peux pas démarrer une conversation avec toi-même' },
      { status: 400 }
    );
  }

  // Vérifie que le destinataire existe (côté profiles, pour éviter de
  // créer une conv vers un fantôme)
  const supabase = createAdminClient();
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', parsed.data.recipient_id)
    .maybeSingle();

  if (!recipient) {
    return NextResponse.json(
      { error: 'Destinataire introuvable' },
      { status: 404 }
    );
  }

  const [a, b] = orderPair(user.id, parsed.data.recipient_id);

  // 1) Existe déjà ?
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ id: existing.id, created: false });
  }

  // 2) Sinon on crée
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .single();

  if (error || !created) {
    console.error('[conversations POST]', error);
    return NextResponse.json(
      { error: 'Création échouée' },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: created.id, created: true });
}
