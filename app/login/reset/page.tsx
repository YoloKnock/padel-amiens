// ============================================
// Page "Mot de passe oublié" — /login/reset
// ============================================
// L'utilisateur saisit son email, Supabase envoie un email avec un lien qui
// pointe vers /auth/update-password. Ce flow est imposé pour des raisons
// de sécurité (on ne peut pas reset un password sans prouver qu'on a accès
// à l'email du compte).

import { Suspense } from 'react';

import { Header } from '@/components/header';
import { ResetPasswordForm } from './reset-form';

export const metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Entre ton email, on t&apos;envoie un lien pour choisir un nouveau mot
            de passe. Vérifie aussi tes spams.
          </p>

          <Suspense
            fallback={
              <div className="h-40 rounded-lg bg-slate-100 animate-pulse" aria-hidden />
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
