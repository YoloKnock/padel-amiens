// ============================================
// Formulaire reset password — client component
// ============================================
// Appelle supabase.auth.resetPasswordForEmail() qui envoie un email avec
// un lien magic vers /auth/update-password.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { createBrowserClient } from '@/lib/supabase';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // Le lien dans l'email arrive sur cette URL avec un code en query string
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    setLoading(false);

    if (error) {
      console.error('[reset-password]', error);
      toast.error("Impossible d'envoyer le lien. Réessaie dans un instant.");
      return;
    }

    // On ne révèle pas si l'email existe en base ou non (anti-énumération)
    setSent(true);
    toast.success('Lien envoyé si le compte existe.');
  }

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <Mail className="w-12 h-12 mx-auto text-emerald-600" />
        <p className="text-sm font-medium">Lien envoyé !</p>
        <p className="text-xs text-muted-foreground">
          Si un compte existe avec <strong>{email}</strong>, tu reçois un lien dans
          quelques secondes pour choisir un nouveau mot de passe.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-emerald-700 underline hover:text-emerald-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email du compte
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
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Envoi...' : 'Envoyer le lien'}
      </button>

      <p className="text-xs text-center text-muted-foreground pt-2">
        <Link href="/login" className="text-emerald-700 underline hover:text-emerald-800">
          ← Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
