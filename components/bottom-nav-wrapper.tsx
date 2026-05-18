// ============================================
// BottomNavWrapper — server component qui charge l'état auth
// ============================================
// La BottomNav est un client component (a besoin de usePathname). On wrap
// ici en server pour fetch user + count messages non lus sans bloquer le
// rendu de la page, et passer en props.

import { BottomNav } from './bottom-nav';
import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';

async function getUnreadMessagesCount(userId: string): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { data: myConvs } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

    const convIds = (myConvs ?? []).map((c) => c.id);
    if (convIds.length === 0) return 0;

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .is('read_at', null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function BottomNavWrapper() {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadMessagesCount(user.id) : 0;

  return <BottomNav isLoggedIn={!!user} unreadMessages={unread} />;
}
