// ============================================
// Page /matchs — listing public des annonces matchmaking
// ============================================
// Server component qui lit la vue public_match_requests (annonces actives,
// non expirées, jointes au profil de l'auteur). Affichage en cards triées
// par date.
//
// Le contact_phone du profil et l'email de l'utilisateur ne sont JAMAIS
// exposés ici : la vue les exclut volontairement. Pour les voir, il faut
// cliquer sur une annonce → /matchs/[id] qui vérifie qu'on est connecté.

import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus, Users } from 'lucide-react';

import { Header } from '@/components/header';
import { MatchRequestCard } from '@/components/match-request-card';
import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Trouver un partenaire de padel',
  description:
    'Annonces locales de joueurs de padel cherchant un partenaire ou un double autour ' +
    'd\'Amiens et de la Picardie. Connecte-toi pour poster ta propre annonce.',
  alternates: { canonical: '/matchs' },
};

export interface MatchRequestRow {
  id: string;
  when_date: string;
  when_hour: string | null;
  location: string | null;
  level_wanted: string | null;
  comment: string | null;
  created_at: string;
  profile_id: string;
  profile_pseudo: string;
  profile_level: string | null;
  profile_city: string | null;
}

async function getMatchRequests(): Promise<MatchRequestRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('public_match_requests')
      .select('*')
      .limit(100);
    if (error) {
      console.warn('[matchs] indisponible:', error.message);
      return [];
    }
    return (data ?? []) as MatchRequestRow[];
  } catch (error) {
    console.warn('[matchs] erreur:', error);
    return [];
  }
}

export default async function MatchsPage() {
  const [requests, user] = await Promise.all([getMatchRequests(), getCurrentUser()]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Hero court */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-2">
              <Users className="w-7 h-7 text-emerald-600" />
              Trouver un partenaire
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Tu cherches quelqu&apos;un pour jouer ou compléter un double ?
              Poste une annonce ou réponds à celles des autres joueurs locaux.
            </p>
          </div>

          {user ? (
            <Link
              href="/matchs/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Poster une annonce
            </Link>
          ) : (
            <Link
              href="/login?next=/matchs/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              Connexion pour poster
            </Link>
          )}
        </div>

        {/* Listing */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Aucune annonce active pour l&apos;instant. Sois le premier à poster !
            </p>
            {user ? (
              <Link
                href="/matchs/nouveau"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Poster une annonce
              </Link>
            ) : (
              <Link
                href="/login?next=/matchs/nouveau"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Me connecter
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req, i) => (
              <MatchRequestCard key={req.id} request={req} index={i} />
            ))}
          </div>
        )}

        {/* Note légale courte */}
        <p className="mt-12 text-xs text-muted-foreground text-center">
          Les annonces sont automatiquement archivées après 14 jours. Tu peux
          retirer la tienne à tout moment depuis ton profil.
        </p>
      </main>
    </div>
  );
}
