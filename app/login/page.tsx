// ============================================
// Page de connexion utilisateur — /login
// ============================================
// Pour la Brique 3 (matchmaking joueurs). Magic Link Supabase, même
// mécanique que /admin/login mais sans whitelist : tout email peut se
// connecter (filtrage via la table banned_emails pour modération a
// posteriori).
//
// Le param ?next= permet de rediriger l'utilisateur vers la page qu'il
// voulait avant qu'on le force à se logger (ex: /matchs/nouveau).

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Header } from '@/components/header';
import { createBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [adultConsent, setAdultConsent] = useState(false);

  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/profil';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!adultConsent) {
      toast.error('Tu dois confirmer avoir 16 ans ou plus.');
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // On force un chemin interne pour `next` côté callback (anti open redirect)
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);

    if (error) {
      console.error('[login] Erreur Magic Link:', error);
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
          <h1 className="text-2xl font-bold mb-2">Connexion</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Connecte-toi pour poster une annonce de recherche de partenaire ou
            consulter les contacts complets des autres joueurs.
          </p>

          {sent ? (
            <div className="text-center py-6 space-y-3">
              <Mail className="w-12 h-12 mx-auto text-emerald-600" />
              <p className="text-sm">
                Un lien de connexion a été envoyé à <strong>{email}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Vérifie aussi tes spams. Le lien expire dans 1 heure.
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

              {/* RGPD : auto-déclaration majeur (16+) */}
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={adultConsent}
                  onChange={(e) => setAdultConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Je confirme avoir <strong>16 ans ou plus</strong> et accepter les{' '}
                  <a href="/mentions-legales" className="underline">
                    mentions légales
                  </a>{' '}
                  (pas de mineurs, pas de spam, pas d&apos;usage commercial).
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !adultConsent}
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
