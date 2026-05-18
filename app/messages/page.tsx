// ============================================
// Liste de mes conversations — /messages
// ============================================
// Server component qui fetch les conversations + leur preview du dernier
// message, puis les rend en liste cliquable. Auto-rafraîchit à chaque
// navigation grâce au `force-dynamic`.

import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

import { Avatar } from '@/components/avatar';
import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';
import { requireUser } from '@/lib/user';
import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/types/message';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mes messages',
  robots: { index: false, follow: false }, // page privée
};

// On n'appelle PAS /api/conversations (qui ferait un fetch HTTP interne)
// — on duplique la logique côté server pour éviter le hop réseau et la
// gestion des cookies. C'est ok parce que la même logique sert 2 contextes
// (rendu initial server + refresh client via /api).
async function getMyConversations(
  userId: string
): Promise<ConversationListItem[]> {
  const supabase = createAdminClient();

  const { data: convs } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b, last_message_at')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('last_message_at', { ascending: false })
    .limit(200);

  const conversations = convs ?? [];
  if (conversations.length === 0) return [];

  const convIds = conversations.map((c) => c.id);
  const otherIds = conversations.map((c) =>
    c.participant_a === userId ? c.participant_b : c.participant_a
  );

  const [
    { data: lastMessages },
    { data: otherProfiles },
    { data: unreadRows },
  ] = await Promise.all([
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, pseudo, avatar_url, city, level')
      .in('id', otherIds),
    supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .is('read_at', null),
  ]);

  const lastByConv = new Map<
    string,
    { id: string; sender_id: string; body: string; created_at: string; read_at: string | null }
  >();
  for (const m of lastMessages ?? []) {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
  }
  const profilesById = new Map<
    string,
    { id: string; pseudo: string; avatar_url: string | null; city: string | null; level: string | null }
  >();
  for (const p of otherProfiles ?? []) profilesById.set(p.id, p);
  const unreadByConv = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    unreadByConv.set(
      row.conversation_id,
      (unreadByConv.get(row.conversation_id) ?? 0) + 1
    );
  }

  return conversations.map((c) => {
    const otherId =
      c.participant_a === userId ? c.participant_b : c.participant_a;
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
}

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await getMyConversations(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <MessageCircle className="w-7 h-7 text-emerald-600" />
          Mes messages
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tes conversations privées avec les autres joueurs.
        </p>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Aucune conversation pour l&apos;instant. Lance une discussion en
              visitant le profil d&apos;un joueur ou en répondant à une annonce.
            </p>
            <Link
              href="/matchs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Voir les annonces
            </Link>
          </div>
        ) : (
          <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {conversations.map((c) => {
              const hasUnread = c.unread_count > 0;
              const timeAgo = c.last_message_at
                ? formatDistanceToNow(parseISO(c.last_message_at), {
                    locale: fr,
                    addSuffix: true,
                  })
                : '';
              const lastIsMine = c.last_message?.sender_id === user.id;

              return (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    className={cn(
                      'block p-4 transition-colors hover:bg-slate-50',
                      hasUnread && 'bg-emerald-50/50 hover:bg-emerald-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        url={c.other.avatar_url}
                        name={c.other.pseudo}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-sm truncate',
                              hasUnread ? 'font-bold' : 'font-medium'
                            )}
                          >
                            {c.other.pseudo}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {timeAgo}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p
                            className={cn(
                              'text-xs truncate',
                              hasUnread
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground'
                            )}
                          >
                            {c.last_message ? (
                              <>
                                {lastIsMine && (
                                  <span className="text-muted-foreground">
                                    Toi :{' '}
                                  </span>
                                )}
                                {c.last_message.body}
                              </>
                            ) : (
                              <span className="italic">
                                Démarre la conversation
                              </span>
                            )}
                          </p>
                          {hasUnread && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex-shrink-0">
                              {c.unread_count > 9 ? '9+' : c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
