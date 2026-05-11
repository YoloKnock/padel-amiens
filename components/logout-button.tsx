// ============================================
// Bouton de déconnexion réutilisable
// ============================================
// Server action inline. Utilisé sur /profil et /admin.

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  async function logout() {
    'use server';
    const { createServerSupabaseClient } = await import('@/lib/supabase-server');
    const { redirect } = await import('next/navigation');
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Déconnexion
      </button>
    </form>
  );
}
