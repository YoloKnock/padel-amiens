// ============================================
// Header de l'application
// ============================================
// Server component async qui détecte la session utilisateur :
//   - logué + profil créé → avatar avec initiale du pseudo + lien /profil
//   - logué mais pas de profil → lien "Mon profil" sans avatar
//   - non logué → bouton "Connexion"
//
// On évite un dropdown complexe (pas de Radix) pour rester sans deps lourdes.
// Cliquer sur l'avatar va directement sur /profil où on trouve déjà toutes
// les actions (déconnexion, suppression compte, mes annonces).

import Link from 'next/link';
import { LogIn } from 'lucide-react';

import { getCurrentProfile, getCurrentUser } from '@/lib/user';

export async function Header() {
  // Lecture parallèle session + profil pour ne pas doubler la latence
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const isLoggedIn = !!user;

  // Initiale affichée dans l'avatar : 1ère lettre du pseudo si dispo,
  // sinon 1ère lettre de l'email, sinon '?'
  const initial =
    profile?.pseudo?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🎾</span>
          <span>Padel Amiens</span>
          <span
            className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 align-middle ml-1"
            title="Version bêta — actuellement Amiens et la région Hauts-de-France"
          >
            Bêta
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 text-sm">
          <Link
            href="/"
            className="font-medium transition-colors hover:text-foreground/80"
          >
            Tournois
          </Link>
          <Link
            href="/jouer"
            className="font-medium transition-colors hover:text-foreground/80"
          >
            Jouer
          </Link>
          <Link
            href="/matchs"
            className="font-medium transition-colors hover:text-foreground/80"
          >
            Partenaires
          </Link>
          <Link
            href="/a-propos"
            className="font-medium transition-colors hover:text-foreground/80 hidden sm:inline"
          >
            À propos
          </Link>

          {/* Bouton avatar / connexion à droite — différencié des liens de nav */}
          <div className="ml-1 sm:ml-3 pl-3 sm:pl-4 border-l border-slate-200">
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
                  <span className="hidden sm:inline font-medium text-sm">
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
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
