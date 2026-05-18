// ============================================
// Aperçu de 6 tournois sur la home (avec animation cascade)
// ============================================
// Pattern landing page : on montre un échantillon de ce que le site contient
// pour donner envie de cliquer, avec un CTA clair "Voir les X tournois"
// vers la page dédiée. Beaucoup plus engageant que d'afficher 99 cards d'un
// coup au scroll.

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy } from 'lucide-react';

import { TournamentCard } from './tournament-card';
import type { TournamentWithClub } from '@/types/tournament';

interface TournamentsPreviewProps {
  tournaments: (TournamentWithClub & { distance_km: number | null })[];
  totalCount: number;
  /** Propagé au FavoriteButton sur chaque card */
  isLoggedIn?: boolean;
}

export function TournamentsPreview({
  tournaments,
  totalCount,
  isLoggedIn = false,
}: TournamentsPreviewProps) {
  // On affiche au max 6 tournois pour rester compact (2 rangées de 3 sur lg)
  const preview = tournaments.slice(0, 6);

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      {/* Titre + CTA aligned sur la même ligne, style landing pro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4 mb-8"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-emerald-600" aria-hidden />
            Prochains tournois FFT
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Tous homologués, filtrables par catégorie / genre / distance.
          </p>
        </div>
        <Link
          href="/tournois"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors group"
        >
          Voir les {totalCount} tournois
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </motion.div>

      {preview.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-muted-foreground">
            Pas de tournoi à venir pour l&apos;instant. Le calendrier se met à
            jour chaque matin à 6h.
          </p>
        </div>
      ) : (
        /* Carrousel horizontal : ligne unique scrollable. Snap-x pour aligner
           les cards proprement après un swipe. Largeur fixe par card pour que
           le user voit toujours "la prochaine card qui dépasse" — invitation
           visuelle à scroller. Le scrollbar est caché sur Webkit. */
        <div className="-mx-4 px-4 overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="flex gap-4 pb-2">
            {preview.map((t, i) => (
              <div
                key={t.id}
                className="snap-start flex-shrink-0 w-[300px] sm:w-[340px]"
              >
                <TournamentCard tournament={t} index={i} isLoggedIn={isLoggedIn} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
