// ============================================
// Formulaire de mise à jour du mot de passe — client component
// ============================================
// L'utilisateur arrive ici depuis le lien dans l'email reset password.
// Supabase a établi une session "recovery" temporaire, qui autorise un
// updateUser() sans re-prouver l'identité.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createBrowserClient } from '@/lib/supabase';

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Le mot de passe doit faire 6 caractères minimum.');
      return;
    }
    if (password !== confirm) {
      toast.error('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      console.error('[update-password]', error);
      // Cas classique : la session recovery a expiré (1h par défaut) →
      // l'utilisateur doit redemander un lien reset
      if (error.message.toLowerCase().includes('session')) {
        toast.error('Le lien a expiré. Redemande un nouveau lien.');
        router.push('/login/reset');
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success('Mot de passe mis à jour, te voilà connecté !');
    router.push('/profil');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium mb-1">
          Confirmer
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Mise à jour...' : 'Mettre à jour mon mot de passe'}
      </button>
    </form>
  );
}
