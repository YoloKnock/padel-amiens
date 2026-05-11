// ============================================
// Page de connexion utilisateur — /login
// ============================================
// Server component minimal qui wrap le formulaire dans <Suspense> (le form
// utilise useSearchParams qui force le rendu dynamique côté client).
// Le contenu interactif est dans login-form.tsx.

import { Suspense } from 'react';

import { Header } from '@/components/header';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Connexion</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Connecte-toi pour poster une annonce de recherche de partenaire ou
            consulter les contacts complets des autres joueurs.
          </p>

          <Suspense
            fallback={
              <div className="h-40 rounded-lg bg-slate-100 animate-pulse" aria-hidden />
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
