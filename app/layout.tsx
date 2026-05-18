// ============================================
// Layout racine de l'application
// ============================================

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

import { BottomNavWrapper } from '@/components/bottom-nav-wrapper';
import './globals.css';

// Viewport + theme color (separe de metadata dans Next.js 14)
// La theme_color colore la barre de statut iOS / Android quand le site est
// installe en PWA. Le manifest.webmanifest est genere par app/manifest.ts.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#059669',
};

// Police Inter chargée par Next.js (auto-optimisée, pas de FOUT)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Métadonnées SEO du site
// Important pour le ranking Google sur "tournoi padel Amiens" et variantes
export const metadata: Metadata = {
  metadataBase: new URL('https://padel-amiens.fr'),
  title: {
    default: 'Padel Amiens — Tous les tournois et événements padel à Amiens',
    template: '%s | Padel Amiens',
  },
  description:
    'Le calendrier complet des tournois homologués FFT (P25, P50, P100) et des événements padel autour d\'Amiens, Cagny et la Picardie.',
  keywords: [
    'padel Amiens',
    'tournoi padel Amiens',
    'P25 Amiens',
    'P100 Amiens',
    'Amiens Padel Cagny',
    'padel Picardie',
    'padel Hauts-de-France',
  ],
  openGraph: {
    title: 'Padel Amiens — Tous les tournois padel près de chez vous',
    description:
      'Le calendrier des tournois et événements padel à Amiens et en Picardie.',
    locale: 'fr_FR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Snippet anti-FOUC pour le mode sombre : applique la classe `dark` sur
// <html> AVANT que React ne s'hydrate. Sans ça, un utilisateur en mode
// sombre verrait un flash blanc sur la 1ère frame. Code minifié manuellement.
const themeInitScript = `(function(){try{var t=localStorage.getItem('padel-amiens.theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* Padding bottom mobile pour que la bottom-nav (h-14 + safe-area)
          ne masque pas la fin du contenu. Sur sm+ on remet à zéro. */}
      <body className={`${inter.variable} font-sans antialiased pb-[calc(56px+env(safe-area-inset-bottom))] sm:pb-0`}>
        {children}
        {/* Bottom nav fixe en bas sur mobile (hidden sm:hidden) — wrapper
            server qui charge le user pour passer le compteur de non-lus. */}
        <BottomNavWrapper />
        {/* Toaster pour les notifications (sonner) */}
        <Toaster position="top-right" />
        {/* Analytics Vercel — gratuit jusqu'à un certain volume */}
        <Analytics />
      </body>
    </html>
  );
}
