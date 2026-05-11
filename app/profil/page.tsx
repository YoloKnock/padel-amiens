// ============================================
// Page profil utilisateur — /profil
// ============================================
// Authentifié uniquement. Sert à la fois pour la création du profile
// (premier login), l'édition, la gestion de mes annonces et la
// suppression de compte.

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, CalendarPlus, Clock, MapPin } from 'lucide-react';

import { DeleteMatchRequestButton } from '@/components/delete-match-request-button';
import { Header } from '@/components/header';
import { ProfileForm } from '@/components/profile-form';
import { LogoutButton } from '@/components/logout-button';
import { createAdminClient } from '@/lib/supabase';
import { getCurrentProfile, requireUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon profil',
  robots: { index: false, follow: false }, // page privée
};

// Récupère les annonces actives de l'utilisateur connecté
async function getMyMatchRequests(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('match_requests')
    .select('id, when_date, when_hour, location, level_wanted, comment, status, expires_at, created_at')
    .eq('profile_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('when_date', { ascending: true });
  if (error) {
    console.error('[profil] erreur fetch mes annonces:', error);
    return [];
  }
  return data ?? [];
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const isNew = profile === null;

  // Pas d'annonces si l'utilisateur n'a pas encore créé son profil
  const myRequests = !isNew ? await getMyMatchRequests(user.id) : [];

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

        {/* ============================================
            Mes annonces de matchmaking actives
            ============================================ */}
        {!isNew && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Mes annonces ({myRequests.length})
              </h2>
              <Link
                href="/matchs/nouveau"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Nouvelle annonce
              </Link>
            </div>

            {myRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-white rounded-xl border border-slate-200 p-4">
                Tu n&apos;as aucune annonce active. Poste-en une depuis le bouton
                ci-dessus pour trouver un partenaire.
              </p>
            ) : (
              <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {myRequests.map((req) => {
                  const dateLabel = format(parseISO(req.when_date), 'EEEE d MMM yyyy', {
                    locale: fr,
                  });
                  return (
                    <li
                      key={req.id}
                      className="p-4 flex items-start justify-between gap-3"
                    >
                      <Link href={`/matchs/${req.id}`} className="flex-1 min-w-0">
                        <div className="text-sm font-medium capitalize mb-1">
                          <CalendarDays className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                          {dateLabel}
                          {req.when_hour && (
                            <span className="text-muted-foreground font-normal">
                              {' '}· {req.when_hour}
                            </span>
                          )}
                        </div>
                        {req.location && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {req.location}
                          </div>
                        )}
                        {req.comment && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            “{req.comment}”
                          </p>
                        )}
                      </Link>
                      <DeleteMatchRequestButton
                        requestId={req.id}
                        variant="inline"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ============================================
            Suppression de compte (zone dangereuse)
            ============================================ */}
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
