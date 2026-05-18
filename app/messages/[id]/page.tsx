// ============================================
// Vue chat d'une conversation — /messages/[id]
// ============================================
// Server component minimal qui valide l'accès (auth + membership) puis
// délègue le rendu à un client component (ChatRoom) qui fait :
//   - rendu initial des messages
//   - polling toutes les 5s pour rapatrier les nouveaux
//   - envoi d'un nouveau message via POST API
//
// Pas de Supabase Realtime pour ce MVP : le polling 5s suffit largement
// pour un usage matchmaking ponctuel (vs un chat type WhatsApp). On
// pourra brancher Realtime plus tard si le besoin se confirme.

import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

import { ChatRoom } from '@/components/chat-room';
import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';
import { requireUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Conversation',
  robots: { index: false, follow: false },
};

export default async function MessageThreadPage({ params }: PageProps) {
  const user = await requireUser();

  // Validation UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b')
    .eq('id', params.id)
    .maybeSingle();

  if (!conv) notFound();
  // Anti-fuite : on bounce si l'user n'est pas membre. Préférable à un 404
  // pour le débogage (l'utilisateur sait qu'il n'a pas les droits).
  if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
    redirect('/messages');
  }

  // Récupération initiale : messages + profil de l'autre
  const otherId =
    conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
  const [{ data: messages }, { data: other }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
      .limit(500),
    supabase
      .from('profiles')
      .select('id, pseudo, avatar_url, city, level')
      .eq('id', otherId)
      .maybeSingle(),
  ]);

  // Marquer les messages reçus comme lus dès qu'on ouvre la conv.
  // Async fire-and-forget : on ne bloque pas le rendu pour ça.
  void supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conv.id)
    .neq('sender_id', user.id)
    .is('read_at', null)
    .then(({ error }) => {
      if (error) console.warn('[messages/[id]] mark-read:', error);
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />
      <ChatRoom
        conversationId={conv.id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
        other={
          other ?? {
            id: otherId,
            pseudo: 'Joueur inconnu',
            avatar_url: null,
            city: null,
            level: null,
          }
        }
      />
    </div>
  );
}
