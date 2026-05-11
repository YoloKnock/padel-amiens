// ============================================
// API Route — Contact d'un annonceur de match
// ============================================
// POST /api/match-requests/contact
// Body: { matchRequestId: string, message: string }
//
// Permet à un user connecté d'envoyer un email à l'auteur d'une annonce
// sans révéler son propre email avant qu'il réponde. L'email part avec
// reply_to = email du sender, pour que l'annonceur réponde directement.
//
// Pourquoi ne pas faire un mailto: classique ? Parce que :
//   1. Sur mobile, mailto: peut ouvrir une app mal configurée (frustration)
//   2. On garde une trace dans Supabase si on veut ajouter un compteur
//      "X personnes t'ont contacté" plus tard
//   3. L'annonceur peut bloquer sans donner son adresse au harceleur

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendEmail } from '@/lib/email';
import { getCurrentUser, isBanned } from '@/lib/user';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const ContactSchema = z.object({
  matchRequestId: z.string().uuid(),
  message: z.string().min(10, 'Message trop court').max(2000),
});

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

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Récupère l'annonce + le profil + l'email auth de l'auteur
  const supabase = createAdminClient();
  const { data: matchReq } = await supabase
    .from('match_requests')
    .select('id, profile_id, when_date, when_hour, location')
    .eq('id', parsed.data.matchRequestId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!matchReq) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  }

  // Le sender ne peut pas se contacter lui-même
  if (matchReq.profile_id === user.id) {
    return NextResponse.json({ error: 'C\'est ta propre annonce' }, { status: 400 });
  }

  // Récupère les infos auth + profile de l'auteur
  const [authorAuth, authorProfile, senderProfile] = await Promise.all([
    supabase.auth.admin.getUserById(matchReq.profile_id),
    supabase.from('profiles').select('pseudo').eq('id', matchReq.profile_id).single(),
    supabase.from('profiles').select('pseudo, city').eq('id', user.id).maybeSingle(),
  ]);

  const authorEmail = authorAuth.data.user?.email;
  const authorPseudo = authorProfile.data?.pseudo ?? 'L\'annonceur';
  const senderPseudo = senderProfile.data?.pseudo ?? user.email ?? 'Un joueur';
  const senderCity = senderProfile.data?.city ?? '';

  if (!authorEmail) {
    return NextResponse.json({ error: 'Email auteur indisponible' }, { status: 500 });
  }

  // Composition du mail
  const detailsLines = [
    matchReq.when_date && `Date demandée : ${matchReq.when_date}`,
    matchReq.when_hour && `Créneau : ${matchReq.when_hour}`,
    matchReq.location && `Lieu : ${matchReq.location}`,
  ].filter(Boolean);

  const text = [
    `Salut ${authorPseudo},`,
    '',
    `${senderPseudo}${senderCity ? ` (${senderCity})` : ''} répond à ton annonce sur Padel Amiens.`,
    '',
    `Son message :`,
    `« ${parsed.data.message} »`,
    '',
    'Pour lui répondre, il suffit de répondre directement à ce mail.',
    '',
    detailsLines.length > 0 ? `Pour rappel, ton annonce :\n${detailsLines.join('\n')}` : '',
    '',
    `Lien direct : https://padel-amiens.fr/matchs/${matchReq.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  const result = await sendEmail({
    to: authorEmail,
    subject: `🎾 ${senderPseudo} répond à ton annonce padel`,
    text,
    replyTo: user.email,
  });

  if (!result.success) {
    // Soft-fail : on dit à l'utilisateur que l'email n'est pas parti, mais
    // on lui donne quand même l'adresse de l'auteur en fallback
    return NextResponse.json(
      {
        error: 'Email non envoyé (notification désactivée pour l\'instant)',
        fallbackEmail: authorEmail,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true });
}
