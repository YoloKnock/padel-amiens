// ============================================
// Bottom Navigation mobile — sticky bas d'écran
// ============================================
// Pattern type Anybuddy / Airbnb / Linear mobile : 4 onglets fixes en bas
// de l'écran, accessibles d'un pouce, avec highlight de l'onglet actif.
// Remplace la nav scroll horizontale qu'on avait sous le header sur mobile
// (cf. audit UX : scroll H = cognitif, l'utilisateur ne voit pas tout).
//
// Visible UNIQUEMENT sur < sm. Sur desktop, c'est la nav du Header qui sert.
// On laisse 80px de padding-bottom dans le layout pour ne pas masquer le
// contenu (cf. app/layout.tsx).

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageCircleMore,
  Trophy,
  UserCircle2,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  /** Préfixe pour le match d'URL actif. Permet de surligner "Tournois"
   *  aussi bien sur /tournois que sur /tournoi/[id]. */
  match: string[];
  /** Si true, on n'affiche cet onglet que si user connecté. */
  authOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Accueil', icon: Home, match: ['/'] },
  {
    href: '/tournois',
    label: 'Tournois',
    icon: Trophy,
    match: ['/tournois', '/tournoi'],
  },
  {
    href: '/matchs',
    label: 'Partenaires',
    icon: Users,
    match: ['/matchs', '/joueur'],
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: MessageCircleMore,
    match: ['/messages'],
    authOnly: true,
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: UserCircle2,
    match: ['/profil', '/login'],
  },
];

interface BottomNavProps {
  /** Permet de montrer l'onglet Messages avec un badge si non-lus. */
  isLoggedIn?: boolean;
  unreadMessages?: number;
}

export function BottomNav({ isLoggedIn = false, unreadMessages = 0 }: BottomNavProps) {
  const pathname = usePathname() ?? '/';

  // Filtrage des onglets selon l'état d'auth — un visiteur non-loggué
  // n'a pas de raison de voir "Messages" puisqu'il n'y a pas accès.
  const items = NAV_ITEMS.filter((it) => !it.authOnly || isLoggedIn);

  return (
    <nav
      aria-label="Navigation principale"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          // Active si pathname commence par un des préfixes (cas /tournoi/[id]
          // par exemple). La home est un cas spécial : match exact uniquement.
          const isActive = item.match.some((m) =>
            m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)
          );
          const showBadge = item.href === '/messages' && unreadMessages > 0;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 h-14 px-2 transition-colors',
                  // Touch target ≥ 48px assuré par h-14 (56px)
                  'focus-visible:outline-none focus-visible:bg-emerald-50',
                  isActive
                    ? 'text-emerald-700'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {/* Petit indicateur barre au-dessus quand actif */}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-600"
                  />
                )}

                {/* Icône avec badge éventuel */}
                <span className="relative">
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform',
                      isActive && 'scale-110'
                    )}
                  />
                  {showBadge && (
                    <span
                      aria-label={`${unreadMessages} non lu`}
                      className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold border-2 border-white"
                    >
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </span>

                <span
                  className={cn(
                    'text-[10px] leading-tight tracking-tight',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
