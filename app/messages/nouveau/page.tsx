// ============================================
// /messages/nouveau?to=<user_id>
// ============================================
// Endpoint "trampoline" : on arrive ici depuis "Envoyer un message" sur
// /joueur/[pseudo] (ou un futur lien dans la fiche annonce). On crée la
// conversation si elle n'existe pas, puis on redirige vers /messages/[id].
//
// Server component "async with redirect" — pas de UI, juste un détour.

import { redirect } from 'next/navigation';

import { createAdminClient } from '@/lib/supabase';
import { requireUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { to?: string };
}

function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export default async function NouveauMessagePage({ searchParams }: PageProps) {
  const user = await requireUser();
  const to = searchParams.to;

  // Validation : UUID + pas moi
  if (!to || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(to)) {
    redirect('/messages');
  }
  if (to === user.id) {
    redirect('/messages');
  }

  const supabase = createAdminClient();

  // Vérifie l'existence du destinataire (anti création vers fantôme)
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', to)
    .maybeSingle();
  if (!recipient) redirect('/messages');

  const [a, b] = orderPair(user.id, to);

  // Existe déjà ?
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();

  if (existing) redirect(`/messages/${existing.id}`);

  // Sinon on crée et on redirige
  const { data: created } = await supabase
    .from('conversations')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .single();

  if (!created) redirect('/messages');
  redirect(`/messages/${created.id}`);
}
