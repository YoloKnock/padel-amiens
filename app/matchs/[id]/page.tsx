// ============================================
// Détail d'une annonce — /matchs/[id]
// ============================================
// Page qui affiche les détails d'une annonce. Si l'utilisateur est connecté,
// on affiche aussi l'email et le téléphone (si renseigné) du propriétaire
// pour qu'il puisse le contacter directement.
//
// Si pas connecté → mention "connecte-toi pour voir le contact".

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Clock, Lock, Mail, MapPin, MessageCircle, Phone, Send, User } from 'lucide-react';

import { Avatar } from '@/components/avatar';
import { DeleteMatchRequestButton } from '@/components/delete-match-request-button';
import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';
import { formatPhone } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

interface MatchRequestDetail {
  id: string;
  when_date: string;
  when_hour: string | null;
  location: string | null;
  level_wanted: string | null;
  comment: string | null;
  status: string;
  expires_at: string;
  profile_id: string;
}

interface ProfileWithEmail {
  pseudo: string;
  level: string | null;
  city: string | null;
  contact_phone: string | null;
  avatar_url: string | null;
  email: string;
}

async function getMatchRequest(id: string): Promise<MatchRequestDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('match_requests')
    .select('id, when_date, when_hour, location, level_wanted, comment, status, expires_at, profile_id')
    .eq('id', id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return data;
}

/**
 * Récupère le profil + l'email auth associé. On utilise le client admin
 * et l'API admin.getUserById pour avoir l'email (pas dans `profiles`).
 */
async function getProfileWithEmail(profileId: string): Promise<ProfileWithEmail | null> {
  const supabase = createAdminClient();

  const [profileRes, userRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('pseudo, level, city, contact_phone, avatar_url')
      .eq('id', profileId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(profileId),
  ]);

  if (!profileRes.data) return null;
  return {
    ...profileRes.data,
    email: userRes.data.user?.email ?? '',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const req = await getMatchRequest(params.id);
  if (!req) return { title: 'Annonce introuvable' };
  return {
    title: `Annonce de match du ${format(parseISO(req.when_date), 'd MMMM', { locale: fr })}`,
    robots: { index: false, follow: false }, // annonces pas indexables
  };
}

const GENDER_LABEL_EMPTY = '';

export default async function MatchRequestDetailPage({ params }: PageProps) {
  const [request, currentUser] = await Promise.all([
    getMatchRequest(params.id),
    getCurrentUser(),
  ]);

  if (!request) notFound();

  const author = await getProfileWithEmail(request.profile_id);
  if (!author) notFound();

  const isOwner = currentUser?.id === request.profile_id;
  const isLoggedIn = !!currentUser;

  const formattedDate = format(parseISO(request.when_date), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        <Link
          href="/matchs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Toutes les annonces
        </Link>

        <article className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          {/* Auteur : avatar + pseudo cliquable vers son profil public */}
          <header className="flex items-start justify-between gap-3 mb-6 pb-6 border-b border-slate-100">
            <Link
              href={`/joueur/${encodeURIComponent(author.pseudo)}`}
              className="flex items-start gap-3 group hover:opacity-80 transition-opacity"
            >
              <Avatar
                url={author.avatar_url}
                name={author.pseudo}
                size="lg"
              />
              <div>
                <h1 className="text-2xl font-bold group-hover:text-emerald-700 transition-colors">
                  {author.pseudo}
                </h1>
                {author.city && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {author.city}
                  </p>
                )}
                {author.level && (
                  <p className="text-sm text-muted-foreground">Niveau : {author.level}</p>
                )}
              </div>
            </Link>
            {isOwner && (
              <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-medium whitespace-nowrap">
                Ton annonce
              </span>
            )}
          </header>

          {/* Détails */}
          <div className="space-y-3 mb-6">
            <Info icon={CalendarDays}>
              <span className="capitalize">{formattedDate}</span>
            </Info>
            {request.when_hour && <Info icon={Clock}>{request.when_hour}</Info>}
            {request.location && <Info icon={MapPin}>{request.location}</Info>}
            {request.level_wanted && (
              <Info icon={User}>
                Cherche : <strong className="text-foreground">{request.level_wanted}</strong>
              </Info>
            )}
          </div>

          {request.comment && (
            <div className="mb-6 p-4 rounded-lg bg-slate-50 text-sm italic text-muted-foreground">
              “{request.comment}”
            </div>
          )}

          {/* Contact (visible aux loggés non-owner uniquement) */}
          <div className="pt-6 border-t border-slate-100">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Contacter {author.pseudo}
            </h2>

            {!isLoggedIn ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm mb-3 flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Connecte-toi pour voir l&apos;email et le téléphone de{' '}
                    {author.pseudo}.
                  </span>
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/matchs/${request.id}`)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Me connecter
                </Link>
              </div>
            ) : isOwner ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  C&apos;est ton annonce. Les autres joueurs te contacteront ici.
                </p>
                <DeleteMatchRequestButton
                  requestId={request.id}
                  redirectTo="/matchs"
                  mode="found"
                />
                <DeleteMatchRequestButton
                  requestId={request.id}
                  redirectTo="/matchs"
                  mode="remove"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {/* CTA principal : DM interne (ne dévoile pas le mail) */}
                <Link
                  href={`/messages/nouveau?to=${request.profile_id}`}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Envoyer un message
                </Link>

                {/* Contacts directs (mail + tel) en secondaire — pratique pour
                    ceux qui préfèrent passer par leur app native */}
                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Ou contact direct :
                  </p>
                  <a
                    href={`mailto:${author.email}?subject=${encodeURIComponent('Padel Amiens - réponse à ton annonce')}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{author.email}</span>
                  </a>
                  {author.contact_phone && (
                    <a
                      href={`tel:${author.contact_phone}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{formatPhone(author.contact_phone)}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Annonce expirée le{' '}
          {format(parseISO(request.expires_at), 'd MMMM yyyy', { locale: fr })} · Pas de
          modération automatique. Si cette annonce te paraît suspecte ou abusive,{' '}
          <a href="mailto:contact@padel-amiens.fr" className="underline">
            signale-la
          </a>
          .
        </p>
      </main>
    </div>
  );
}

// ============================================
// Ligne d'info avec icône
// ============================================
function Info({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
