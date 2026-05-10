// ============================================
// Back-office admin — /admin (dashboard events)
// ============================================
// Page protégée. Affiche :
//   1. Un formulaire de création d'event en haut
//   2. La liste des events existants en bas, avec actions inline
//      (toggle publish, suppression)
//
// On reste sur UNE page pour la simplicité (pas de new/edit séparées).
// L'édition se fera dans un futur incrément si besoin.

import { LogOut } from 'lucide-react';

import { Header } from '@/components/header';
import { AdminEventForm } from '@/components/admin/event-form';
import { AdminEventsList } from '@/components/admin/events-list';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase';

// Pas de cache : on veut voir les events à jour en temps réel
export const dynamic = 'force-dynamic';

/**
 * Récupère la liste des clubs pour le select du formulaire.
 * On ne tape que id + name + city, le reste n'est pas utile à l'admin.
 */
async function getClubs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, city')
    .order('name');

  if (error) {
    console.error('[admin] Erreur fetch clubs:', error);
    return [];
  }
  return data ?? [];
}

/**
 * Récupère tous les events (toutes statuts confondus) pour l'admin.
 * On bypass la RLS via le client admin pour voir aussi les drafts.
 *
 * La jointure embarquée `clubs(name, city)` retourne un array côté TS
 * (typage Supabase faible sur les FK), alors qu'en pratique c'est un
 * one-to-one. On aplatit ici pour exposer un objet simple au composant.
 */
async function getAllEvents() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, event_type, title, status, start_date, end_date, club_id, clubs(name, city)'
    )
    .order('start_date', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[admin] Erreur fetch events:', error);
    return [];
  }

  // Aplatissement : clubs vient comme array, on prend le premier (ou null)
  return (data ?? []).map((row) => {
    const clubsRaw = row.clubs as unknown;
    const club = Array.isArray(clubsRaw)
      ? (clubsRaw[0] as { name: string | null; city: string | null } | undefined)
      : (clubsRaw as { name: string | null; city: string | null } | null);
    return {
      ...row,
      clubs: club ?? null,
    };
  });
}

export default async function AdminDashboardPage() {
  // Garde-fou : redirige vers /admin/login si non authentifié ou pas admin
  const user = await requireAdmin();

  const [clubs, events] = await Promise.all([getClubs(), getAllEvents()]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Bandeau identité + déconnexion */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Back-office</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connecté en tant que <strong>{user.email}</strong>
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Formulaire de création */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Nouvel événement</h2>
          <AdminEventForm clubs={clubs} />
        </section>

        {/* Liste des events existants */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Événements ({events.length})
          </h2>
          <AdminEventsList events={events} />
        </section>
      </main>
    </div>
  );
}

// ============================================
// Bouton de déconnexion (server action inline)
// ============================================
// On utilise un form avec une server action plutôt qu'un client component
// pour pouvoir invalider les cookies côté serveur directement.
function LogoutButton() {
  async function logout() {
    'use server';
    const { createServerSupabaseClient } = await import('@/lib/supabase-server');
    const { redirect } = await import('next/navigation');
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </form>
  );
}
