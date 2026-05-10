// ============================================
// Header de l'application
// ============================================

import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🎾</span>
          <span>Padel Amiens</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="font-medium transition-colors hover:text-foreground/80"
          >
            Tournois
          </Link>
          {/* À venir : Americano, Communauté, etc. */}
        </nav>
      </div>
    </header>
  );
}
