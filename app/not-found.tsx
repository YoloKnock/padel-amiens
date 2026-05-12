// ============================================
// Page 404 — Not Found
// ============================================
// Affichée automatiquement par Next.js quand une URL n'existe pas (ou
// quand un server component appelle notFound()). Design épuré et chaleureux
// pour ne pas perdre le visiteur — on lui montre les chemins principaux
// du site.

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Search, Trophy } from 'lucide-react';

import { Header } from '@/components/header';

export const metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-16 md:py-24 max-w-2xl text-center">
        {/* Code 404 stylisé en grand */}
        <div className="relative inline-block mb-6">
          <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent tracking-tight">
            404
          </h1>
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
            aria-hidden
          />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Cette page n&apos;existe pas (ou plus)
        </h2>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto">
          Le tournoi ou le club que tu cherches a peut-être été retiré, ou
          l&apos;URL est incorrecte. Voilà où tu peux aller :
        </p>

        {/* 3 raccourcis vers les pages principales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <ShortcutCard
            href="/tournois"
            icon={Trophy}
            title="Voir les tournois"
            description="Calendrier FFT à venir"
          />
          <ShortcutCard
            href="/jouer"
            icon={Search}
            title="Trouver un créneau"
            description="Centres et réservations"
          />
          <ShortcutCard
            href="/matchs"
            icon={MessageCircle}
            title="Un partenaire"
            description="Annonces de joueurs"
          />
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Retour à l&apos;accueil
        </Link>
      </main>
    </div>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Trophy;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
    >
      <Icon className="w-6 h-6 text-emerald-600 mb-2" aria-hidden />
      <div className="font-semibold text-sm mb-0.5 group-hover:text-emerald-700 transition-colors">
        {title}
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </Link>
  );
}
