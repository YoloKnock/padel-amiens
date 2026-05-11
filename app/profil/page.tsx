// ============================================
// Page profil utilisateur — /profil
// ============================================
// Authentifié uniquement. Sert à la fois pour la création du profile
// (premier login) et l'édition.

import { Header } from '@/components/header';
import { ProfileForm } from '@/components/profile-form';
import { LogoutButton } from '@/components/logout-button';
import { getCurrentProfile, requireUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon profil',
  robots: { index: false, follow: false }, // page privée
};

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const isNew = profile === null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isNew ? 'Crée ton profil' : 'Mon profil'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connecté en tant que <strong>{user.email}</strong>
            </p>
          </div>
          <LogoutButton />
        </div>

        {isNew && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm">
            <strong className="text-foreground">Premier login !</strong> Choisis un
            pseudo public pour pouvoir poster des annonces de matchs. Les autres
            joueurs verront ce pseudo, ta ville, ton niveau — pas ton email.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <ProfileForm profile={profile} email={user.email ?? ''} />
        </div>

        {!isNew && (
          <div className="mt-8 p-4 rounded-lg bg-red-50 border border-red-200">
            <h2 className="font-semibold text-red-900 mb-2">Supprimer mon compte</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Suppression définitive de ton profil, tes annonces, et ton compte
              Supabase. Action irréversible (droit à l&apos;oubli RGPD).
            </p>
            <DeleteAccountButton />
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================
// Bouton "Supprimer mon compte" (server action inline)
// ============================================
function DeleteAccountButton() {
  async function deleteAccount() {
    'use server';
    const { createServerSupabaseClient } = await import('@/lib/supabase-server');
    const { createAdminClient } = await import('@/lib/supabase');
    const { redirect } = await import('next/navigation');

    const supabaseSession = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabaseSession.auth.getUser();
    if (!user) {
      redirect('/login');
    }

    // Le ON DELETE CASCADE sur profiles → match_requests fait le ménage.
    // On supprime aussi l'utilisateur auth pour respecter le droit à l'oubli.
    // user! : redirect throw, donc TS devrait savoir mais ne narrow pas.
    const userId = user!.id;
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseSession.auth.signOut();
    redirect('/');
  }

  return (
    <form action={deleteAccount}>
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
      >
        Supprimer définitivement
      </button>
    </form>
  );
}
