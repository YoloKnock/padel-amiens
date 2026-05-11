// ============================================
// Page de saisie du nouveau mot de passe — /auth/update-password
// ============================================
// L'utilisateur arrive ici depuis le lien dans l'email reset. À ce stade,
// Supabase a déjà établi une session "recovery" (via /auth/callback qui a
// échangé le code). L'utilisateur peut donc updateUser({ password }) sans
// re-prouver son identité.

import { Header } from '@/components/header';
import { UpdatePasswordForm } from './update-password-form';

export const metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Choisis un mot de passe d&apos;au moins 6 caractères. Tu seras connecté
            automatiquement après.
          </p>

          <UpdatePasswordForm />
        </div>
      </main>
    </div>
  );
}
