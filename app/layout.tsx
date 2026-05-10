// ============================================
// Layout racine de l'application
// ============================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        {/* Toaster pour les notifications (sonner) */}
        <Toaster position="top-right" />
        {/* Analytics Vercel — gratuit jusqu'à un certain volume */}
        <Analytics />
      </body>
    </html>
  );
}
