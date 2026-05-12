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
import { LogIn } from 'lucide-react';

import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { getCurrentProfile, getCurrentUser } from '@/lib/user';

export async function Header() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const isLoggedIn = !!user;

  const initial =
    profile?.pseudo?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

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

        {/* Bloc droite : theme + avatar/connexion */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />

          {isLoggedIn ? (
            <Link
              href="/profil"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
              title={profile?.pseudo ?? user?.email ?? 'Mon profil'}
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm border-2 border-transparent group-hover:border-emerald-300 transition-colors"
              >
                {initial}
              </span>
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

      {/* Navigation mobile — scrollable horizontal sous le header sur < sm */}
      <nav className="sm:hidden border-t border-slate-100 bg-white/60 overflow-x-auto">
        <div className="container mx-auto px-4 flex items-center gap-5 text-sm h-11 whitespace-nowrap">
          <Link href="/tournois" className="font-medium hover:text-emerald-700">
            Tournois
          </Link>
          <Link href="/jouer" className="font-medium hover:text-emerald-700">
            Jouer
          </Link>
          <Link href="/matchs" className="font-medium hover:text-emerald-700">
            Partenaires
          </Link>
          <Link
            href="/a-propos"
            className="text-muted-foreground hover:text-emerald-700"
          >
            À propos
          </Link>
        </div>
      </nav>
    </header>
  );
}
