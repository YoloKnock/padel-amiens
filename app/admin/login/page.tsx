// ============================================
// Page de connexion admin — /admin/login
// ============================================
// Envoie un Magic Link par email à l'utilisateur. Quand il clique sur le lien
// dans son mail, il arrive sur /auth/callback qui établit la session et le
// redirige vers /admin.
//
// Sécurité : on ne révèle pas si l'email est dans la whitelist ou non. On
// envoie le mail dans tous les cas (Supabase gère), et seul un email dans
// `ADMIN_EMAILS` aura accès aux pages /admin après authentification.

'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Header } from '@/components/header';
import { createBrowserClient } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const supabase = createBrowserClient();

    // signInWithOtp envoie un Magic Link. `emailRedirectTo` doit pointer
    // vers une route Next.js qui établit la session (cf. /auth/callback).
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    setLoading(false);

    if (error) {
      console.error('[admin/login] Erreur Magic Link:', error);
      toast.error("Impossible d'envoyer le lien. Réessaie dans un instant.");
      return;
    }

    setSent(true);
    toast.success('Lien de connexion envoyé !');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Connexion admin</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Saisis ton email pour recevoir un lien de connexion. Seuls les emails
            autorisés accéderont au back-office.
          </p>

          {sent ? (
            // État post-envoi : pas de re-submit en boucle, on attend le clic
            // dans le mail
            <div className="text-center py-6 space-y-3">
              <Mail className="w-12 h-12 mx-auto text-emerald-600" />
              <p className="text-sm">
                Si l&apos;adresse <strong>{email}</strong> est autorisée, tu reçois un
                lien d&apos;ici quelques secondes.
              </p>
              <p className="text-xs text-muted-foreground">
                Vérifie aussi tes spams.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="ton.email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Envoi...' : 'Recevoir le lien'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
