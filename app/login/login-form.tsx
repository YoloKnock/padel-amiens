// ============================================
// Formulaire de connexion (Magic Link)
// ============================================
// Séparé du fichier page.tsx pour pouvoir être wrapé dans un <Suspense>
// côté parent (useSearchParams force le rendu dynamic, Next.js demande
// explicitement la barrière Suspense en mode App Router).

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { createBrowserClient } from '@/lib/supabase';

export function LoginForm() {
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

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <Mail className="w-12 h-12 mx-auto text-emerald-600" />
        <p className="text-sm">
          Un lien de connexion a été envoyé à <strong>{email}</strong>.
        </p>
        <p className="text-xs text-muted-foreground">
          Vérifie aussi tes spams. Le lien expire dans 1 heure.
        </p>
      </div>
    );
  }

  return (
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
  );
}
