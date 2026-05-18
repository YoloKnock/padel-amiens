// ============================================
// Page profil utilisateur — /profil
// ============================================
// Authentifié uniquement. Sert à la fois pour la création du profile
// (premier login), l'édition, la gestion de mes annonces et la
// suppression de compte.

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Heart,
  MapPin,
  Trophy,
} from 'lucide-react';

import { DeleteMatchRequestButton } from '@/components/delete-match-request-button';
import { Header } from '@/components/header';
import { ProfileForm } from '@/components/profile-form';
import { LogoutButton } from '@/components/logout-button';
import { distanceFromAmiens } from '@/lib/geo';
import { createAdminClient } from '@/lib/supabase';
import { getCurrentProfile, requireUser } from '@/lib/user';
import type { TournamentWithClub } from '@/types/tournament';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon profil',
  robots: { index: false, follow: false }, // page privée
};

// ============================================
// Récupère les tournois favoris de l'utilisateur connecté
// ============================================
// On fait 2 queries séparées :
//   1) liste des tournament_id favoris
//   2) détails des tournois (depuis la vue upcoming_tournaments) qui
//      filtre déjà les tournois passés.
// Plus simple que d'inventer une vue dédiée juste pour ça, et la perf est
// négligeable (1 user a rarement 100+ favoris).
async function getMyFavorites(
  userId: string
): Promise<(TournamentWithClub & { distance_km: number | null })[]> {
  const supabase = createAdminClient();
  const { data: favRows, error: favErr } = await supabase
    .from('tournament_favorites')
    .select('tournament_id')
    .eq('user_id', userId);
  if (favErr) {
    console.error('[profil] favoris:', favErr);
    return [];
  }
  const ids = (favRows ?? []).map((r) => r.tournament_id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('upcoming_tournaments')
    .select('*')
    .in('id', ids)
    .order('start_date', { ascending: true });
  if (error) {
    console.error('[profil] favoris details:', error);
    return [];
  }
  return (data ?? []).map((t) => ({
    ...t,
    distance_km: distanceFromAmiens(t.club_lat, t.club_lng),
  }));
}

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

  // Pas d'annonces ni favoris si l'utilisateur n'a pas encore créé son profil
  const [myRequests, myFavorites] = !isNew
    ? await Promise.all([getMyMatchRequests(user.id), getMyFavorites(user.id)])
    : [[], []];

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
            Mes tournois favoris
            ============================================
            Section visible uniquement si profil créé. On limite l'affichage
            aux 8 favoris les plus proches dans le temps avec un lien "voir
            tout" si on dépasse. */}
        {!isNew && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Mes tournois favoris ({myFavorites.length})
              </h2>
              {myFavorites.length > 0 && (
                <Link
                  href="/tournois"
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                >
                  Tous les tournois <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {myFavorites.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-white rounded-xl border border-slate-200 p-4">
                Tu n&apos;as encore favorisé aucun tournoi. Clique sur le ★ en
                haut à droite d&apos;un tournoi pour le retrouver ici.
              </div>
            ) : (
              <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {myFavorites.slice(0, 8).map((t) => {
                  const dateLabel = format(
                    parseISO(t.start_date),
                    'EEEE d MMM yyyy',
                    { locale: fr }
                  );
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/tournoi/${t.id}`}
                        className="block p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                {t.category}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {t.gender}
                              </span>
                            </div>
                            <div className="text-sm font-medium truncate">
                              {t.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 capitalize">
                              <CalendarDays className="w-3 h-3" />
                              {dateLabel}
                              {t.club_name && (
                                <>
                                  <span className="opacity-50 mx-0.5">·</span>
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{t.club_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
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
