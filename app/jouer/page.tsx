// ============================================
// Page /jouer — Trouver un créneau de padel
// ============================================
// Server component qui fetch la liste des clubs réservables, puis délègue
// au composant client BookingSearch la partie interactive (sélection
// date/heure/distance + redirection deep-link vers la plateforme du club).
//
// Pourquoi server component pour le fetch ?
// → SEO long-tail : la liste des clubs est dans le HTML rendu, donc Google
//   indexe la page avec le contenu réel ("padel Cagny", "padel Wimereux",
//   etc.) sans avoir à exécuter notre JS.

import type { Metadata } from 'next';
import { Search } from 'lucide-react';

import { Header } from '@/components/header';
import { BookingSearch } from '@/components/booking-search';
import { distanceFromAmiens } from '@/lib/geo';
import { createAdminClient } from '@/lib/supabase';
import type { BookableClub } from '@/types/tournament';

// Revalidation horaire — les clubs et leurs URLs de booking changent rarement
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Réserver un créneau padel près d\'Amiens',
  description:
    'Trouve un terrain de padel disponible autour d\'Amiens, Cagny et la Picardie. ' +
    'Date, heure, distance — un clic pour réserver sur Playtomic.',
  alternates: { canonical: '/jouer' },
};

/**
 * Récupère tous les clubs qui ont une plateforme de booking configurée,
 * avec la distance depuis Cagny calculée côté serveur.
 */
async function getBookableClubs(): Promise<(BookableClub & { distance_km: number | null })[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('clubs')
    .select(
      'id, name, city, postal_code, latitude, longitude, booking_platform, ' +
      'booking_url_template, contact_email, contact_phone'
    )
    .not('booking_platform', 'is', null)
    .neq('booking_platform', 'none')
    .order('name');

  if (error) {
    console.error('[jouer] Erreur fetch clubs:', error);
    return [];
  }

  // Le typage Supabase de `select(string)` peut être lossy (renvoie un union
  // avec GenericStringError quand la string est longue). On caste explicitement
  // vers notre interface BookableClub pour pouvoir manipuler les colonnes.
  const rows = (data ?? []) as unknown as BookableClub[];

  return rows.map((club) => ({
    ...club,
    distance_km: distanceFromAmiens(club.latitude, club.longitude),
  }));
}

export default async function JouerPage() {
  const clubs = await getBookableClubs();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* Hero court */}
      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
            <Search className="w-4 h-4" />
            Trouver un créneau
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Quand veux-tu <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">jouer</span> ?
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Choisis une date, une heure et la distance maximale depuis Cagny. On t&apos;envoie
            sur la plateforme de réservation du club pour voir les vraies dispos en direct.
          </p>
        </div>
      </section>

      {/* Widget de recherche + résultats (client component) */}
      <section className="container mx-auto px-4 pb-20">
        <BookingSearch clubs={clubs} />
      </section>

      {/* Note de transparence : on ne stocke pas les dispos */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Comment ça marche ?</strong> Padel Amiens ne stocke
          aucune disponibilité. On t&apos;envoie directement sur la page de réservation officielle
          du club (Playtomic principalement) avec ta date et ton heure pré-remplies. Tu vois les
          vraies dispos en temps réel, là où elles sont, et tu réserves en un clic.
        </div>
      </section>
    </div>
  );
}
