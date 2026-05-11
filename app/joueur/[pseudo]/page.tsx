// ============================================
// Profil public d'un joueur — /joueur/[pseudo]
// ============================================
// Fiche publique d'un joueur identifié par son pseudo (unique, contrainte
// CITEXT-like via index fonctionnel lower(pseudo)). Affiche son pseudo,
// niveau, ville et ses annonces actives. Pas d'email ni de téléphone
// exposés ici — ces données restent visibles uniquement sur /matchs/[id]
// et uniquement aux utilisateurs connectés.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Clock, MapPin, MessageCircle, User } from 'lucide-react';

import { Header } from '@/components/header';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { pseudo: string };
}

interface PublicProfileView {
  id: string;
  pseudo: string;
  level: string | null;
  city: string | null;
}

interface MatchRequestPreview {
  id: string;
  when_date: string;
  when_hour: string | null;
  location: string | null;
  level_wanted: string | null;
  comment: string | null;
}

async function getProfileByPseudo(pseudo: string): Promise<PublicProfileView | null> {
  // Validation : pseudo peut contenir lettres, chiffres, tirets, underscores,
  // espaces ou points. On bloque les caractères surprises pour anti-scan.
  if (!/^[\w .-]{3,30}$/.test(pseudo)) return null;

  const supabase = createAdminClient();
  // ilike pour matcher pseudo case-insensitive (cohérent avec l'index unique)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, pseudo, level, city')
    .ilike('pseudo', pseudo)
    .maybeSingle();

  if (error) {
    console.error('[joueur/[pseudo]]', error);
    return null;
  }
  return data;
}

async function getActiveRequestsFor(profileId: string): Promise<MatchRequestPreview[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('match_requests')
    .select('id, when_date, when_hour, location, level_wanted, comment')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('when_date', { ascending: true });
  return data ?? [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProfileByPseudo(decodeURIComponent(params.pseudo));
  if (!profile) return { title: 'Joueur introuvable' };

  return {
    title: `${profile.pseudo}${profile.city ? ` · ${profile.city}` : ''}`,
    description: `Profil padel de ${profile.pseudo}${profile.level ? ` (${profile.level})` : ''}${profile.city ? ` à ${profile.city}` : ''}.`,
    alternates: { canonical: `/joueur/${params.pseudo}` },
    // Profils non-indexés par défaut — RGPD friendly, l'utilisateur peut
    // explicitement opter pour l'indexation plus tard si on le souhaite.
    robots: { index: false, follow: true },
  };
}

export default async function JoueurPage({ params }: PageProps) {
  const pseudo = decodeURIComponent(params.pseudo);
  const profile = await getProfileByPseudo(pseudo);
  if (!profile) notFound();

  const requests = await getActiveRequestsFor(profile.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Link
          href="/matchs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Toutes les annonces
        </Link>

        {/* ============================================
            En-tête : avatar + pseudo + meta
            ============================================ */}
        <header className="flex items-start gap-4 mb-8">
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 font-bold text-2xl flex-shrink-0"
          >
            {profile.pseudo[0]?.toUpperCase() ?? '?'}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
              <User className="w-6 h-6 text-emerald-600" />
              {profile.pseudo}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {profile.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.city}
                </span>
              )}
              {profile.level && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                  {profile.level}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ============================================
            Annonces actives
            ============================================ */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            Annonces actives ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {profile.pseudo} n&apos;a aucune annonce active pour l&apos;instant.
              </p>
              <Link
                href="/matchs"
                className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-700 underline hover:text-emerald-800"
              >
                Voir les annonces des autres joueurs
              </Link>
            </div>
          ) : (
            <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {requests.map((req) => {
                const dateLabel = format(parseISO(req.when_date), 'EEEE d MMM yyyy', {
                  locale: fr,
                });
                return (
                  <li key={req.id} className="p-4">
                    <Link href={`/matchs/${req.id}`} className="block hover:opacity-80">
                      <div className="text-sm font-medium capitalize mb-1">
                        <CalendarDays className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        {dateLabel}
                        {req.when_hour && (
                          <span className="text-muted-foreground font-normal">
                            {' '}· <Clock className="w-3 h-3 inline -mt-0.5" /> {req.when_hour}
                          </span>
                        )}
                      </div>
                      {req.location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" />
                          {req.location}
                        </div>
                      )}
                      {req.level_wanted && (
                        <div className="text-xs text-muted-foreground">
                          Cherche : <strong>{req.level_wanted}</strong>
                        </div>
                      )}
                      {req.comment && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                          “{req.comment}”
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-10 text-xs text-muted-foreground text-center">
          Profil public sur Padel Amiens. Le contact direct se fait depuis une
          annonce spécifique, une fois connecté.
        </p>
      </main>
    </div>
  );
}
