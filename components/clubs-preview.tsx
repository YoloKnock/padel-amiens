// ============================================
// Aperçu des clubs en vedette sur la home
// ============================================
// Affiche les 4 clubs principaux d'Amiens avec leur photo en cover. C'est
// le visuel le plus impactant de la home : 4 grandes photos qui montrent
// que le site est connecté à des vrais centres locaux.
//
// Les clubs affichés sont ceux qui ont une cover_image_url ET qui sont les
// plus proches d'Amiens (filtre fait côté server avant de passer la prop).

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';

import type { BookableClub } from '@/types/tournament';

interface ClubsPreviewProps {
  /** Clubs déjà filtrés et triés côté server (avec cover_image_url). */
  clubs: (BookableClub & { distance_km: number | null })[];
}

export function ClubsPreview({ clubs }: ClubsPreviewProps) {
  if (clubs.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4 mb-8"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Les centres padel d&apos;Amiens
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Les complexes principaux pour réserver un créneau près de chez toi.
          </p>
        </div>
        <Link
          href="/jouer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors group"
        >
          Voir tous les centres
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clubs.map((club, i) => (
          <motion.div
            key={club.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Link
              href={`/club/${club.id}`}
              className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:shadow-emerald-100/60 transition-all"
            >
              {/* Photo cover plein largeur, ratio fixe pour homogénéité */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-200 overflow-hidden">
                {club.cover_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={club.cover_image_url}
                    alt={`Photo du complexe ${club.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40" aria-hidden>
                    🎾
                  </div>
                )}
                {/* Overlay gradient bottom pour lisibilité du badge distance */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                {club.distance_km !== null && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-800">
                    {club.distance_km} km
                  </span>
                )}
              </div>

              {/* Infos compactes en bas */}
              <div className="p-3">
                <h3 className="font-semibold text-sm leading-tight group-hover:text-emerald-700 transition-colors">
                  {club.name}
                </h3>
                {club.city && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" aria-hidden />
                    {club.city}
                  </p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
