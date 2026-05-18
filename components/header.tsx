// ============================================
// Header de l'application — version simplifiée
// ============================================
// Sur desktop : Tournois / Jouer / Partenaires + theme + avatar
// Sur mobile : juste theme + avatar visible, le menu pages s'affiche
// sous le header en navigation horizontale scrollable.
//
// "À propos" est sorti de la nav principale (visible dans le footer) pour
// alléger la barre top et garder le focus sur les 3 actions principales.

import Link from 'next/link';
import { LogIn, MessageCircle } from 'lucide-react';

import { Avatar } from './avatar';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { createAdminClient } from '@/lib/supabase';
import { getCurrentProfile, getCurrentUser } from '@/lib/user';

// Compte les messages NON LUS reçus par le user connecté.
// Sert à afficher une pastille rouge dans le header → garde le user alerté
// sans avoir à push de notif système.
//
// Implem : 2 queries explicites plutôt qu'un join avec `or` sur foreignTable
// (syntaxe Supabase fragile selon les versions). D'abord les IDs de mes
// conversations, puis compte des non-lus dont sender != moi.
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

export async function Header() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const isLoggedIn = !!user;
  const unreadMessages = user ? await getUnreadMessagesCount(user.id) : 0;

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo — typographie pure sans emoji */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Logo />
          <span
            className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 align-middle"
            title="Version bêta — Amiens & Hauts-de-France"
          >
            Bêta
          </span>
        </Link>

        {/* Navigation centrale — visible sur sm+, scrollable horizontalement sinon */}
        <nav className="hidden sm:flex items-center gap-5 text-sm flex-1 justify-center">
          <Link
            href="/tournois"
            className="font-medium transition-colors hover:text-emerald-700"
          >
            Tournois
          </Link>
          <Link
            href="/jouer"
            className="font-medium transition-colors hover:text-emerald-700"
          >
            Jouer
          </Link>
          <Link
            href="/matchs"
            className="font-medium transition-colors hover:text-emerald-700"
          >
            Partenaires
          </Link>
        </nav>

        {/* Bloc droite : theme + (messages) + avatar/connexion */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />

          {/* Icône messagerie avec pastille de non-lus, visible si connecté.
              Touch target 40px (au-dessus du min 48px ergonomique parce
              qu'on est en desktop ; sur mobile on a la bottom nav). */}
          {isLoggedIn && (
            <Link
              href="/messages"
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
              title={
                unreadMessages > 0
                  ? `${unreadMessages} message${unreadMessages > 1 ? 's' : ''} non lu${unreadMessages > 1 ? 's' : ''}`
                  : 'Mes messages'
              }
            >
              <MessageCircle className="w-5 h-5 text-slate-700" />
              {unreadMessages > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold border-2 border-white"
                  aria-label={`${unreadMessages} non lu`}
                >
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          )}

          {isLoggedIn ? (
            <Link
              href="/profil"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
              title={profile?.pseudo ?? user?.email ?? 'Mon profil'}
            >
              <Avatar
                url={profile?.avatar_url ?? null}
                name={profile?.pseudo ?? user?.email}
                size="md"
                className="border-2 border-transparent group-hover:border-emerald-300 transition-colors"
              />
              {profile?.pseudo && (
                <span className="hidden md:inline font-medium text-sm">
                  {profile.pseudo}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Connexion</span>
            </Link>
          )}
        </div>
      </div>

      {/* Sur mobile, la nav est en bas via <BottomNav /> (rendu par le
          layout racine). On a viré la nav scroll horizontale sous le
          header : cf. audit UX, scroll H = cognitif, l'user voyait pas
          tout d'un coup. La bottom nav est plus standard et accessible
          au pouce. */}
    </header>
  );
}
