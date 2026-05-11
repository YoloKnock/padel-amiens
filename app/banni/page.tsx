// ============================================
// Page /banni — pour les emails dans banned_emails
// ============================================
// Affichée par requireUser() quand l'utilisateur est dans la liste noire
// de modération. Volontairement sobre et informative.

import { Header } from '@/components/header';

export const metadata = {
  title: 'Accès suspendu',
  robots: { index: false, follow: false },
};

export default function BanniPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white rounded-2xl border border-red-200 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-3 text-red-700">Accès suspendu</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Ton accès aux fonctionnalités matchmaking est temporairement suspendu
            suite à un signalement.
          </p>
          <p className="text-sm text-muted-foreground">
            Si tu penses qu&apos;il s&apos;agit d&apos;une erreur, contacte-nous à{' '}
            <a
              href="mailto:contact@padel-amiens.fr"
              className="text-emerald-700 underline"
            >
              contact@padel-amiens.fr
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
