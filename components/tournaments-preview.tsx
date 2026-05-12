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
}

export function TournamentsPreview({ tournaments, totalCount }: TournamentsPreviewProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {preview.map((t, i) => (
            <TournamentCard key={t.id} tournament={t} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
