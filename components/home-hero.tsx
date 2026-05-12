// ============================================
// Hero de la home — image impactante + parallax léger
// ============================================
// Refonte demandée par Hugo : la précédente version avait une image
// "à peine visible" à cause d'un overlay trop lourd. Approche nouvelle :
//   - Image plein écran bien visible (opacity 0.55)
//   - Pas d'overlay global qui mange l'image
//   - Le TEXTE a son propre fond glassmorphism (backdrop-blur + bg semi-
//     transparent) → lisible sans tuer l'image
//   - Parallax léger : useScroll + useTransform = l'image bouge plus lentement
//     que le contenu au scroll, donne une vraie profondeur
//
// Pattern qu'on voit sur les sites pro (Apple, Stripe landing).

'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowDown, Calendar, MessageCircle, Search, Trophy, Users } from 'lucide-react';

import { AnimatedCounter } from './animated-counter';

interface HomeHeroProps {
  stats: {
    tournaments: number;
    players: number;
    matchRequests: number;
  };
}

export function HomeHero({ stats }: HomeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Parallax : l'image se déplace plus lentement que le scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  // Image qui descend de 0 à 100px pendant que la section sort de l'écran
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  // Texte qui monte légèrement (effet contre-parallax pour la profondeur)
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);

  return (
    <section ref={containerRef} className="relative h-[88vh] min-h-[560px] max-h-[760px] overflow-hidden">
      {/* Image padel plein écran avec parallax. Opacity 0.55 → bien visible
          mais le texte par-dessus reste lisible grâce au glassmorphism. */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 -top-12 -bottom-12"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1743456110628-6508997cf730?w=2000&q=85&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Dégradé subtil du bas vers le contenu (fond du site) */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />
      </motion.div>

      {/* Contenu avec contre-parallax + glassmorphism sur le bloc texte */}
      <motion.div
        style={{ y: contentY }}
        className="relative h-full flex items-center justify-center"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Bloc texte avec backdrop-blur pour lisibilité sur photo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-center bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-2xl border border-white/40 dark:border-slate-700/40"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium mb-4">
                <Trophy className="w-3.5 h-3.5" aria-hidden />
                Tournois FFT · Amiens & Hauts-de-France
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
                Le padel local,{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  en un seul endroit
                </span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-lg mx-auto">
                Tournois FFT, créneaux dispos, partenaires de jeu — tout au
                même endroit, gratuit, et 100% local.
              </p>

              {/* CTAs primaires */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                <Link
                  href="/tournois"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all hover:scale-105 shadow-lg shadow-emerald-600/20"
                >
                  <Trophy className="w-4 h-4" aria-hidden />
                  Voir les tournois
                </Link>
                <Link
                  href="/jouer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  <Search className="w-4 h-4" aria-hidden />
                  Trouver un créneau
                </Link>
                <Link
                  href="/matchs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden />
                  Trouver un partenaire
                </Link>
              </div>

              {/* Compteurs animés (count-up au mount) */}
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden />
                  <strong className="text-foreground tabular-nums">
                    <AnimatedCounter value={stats.tournaments} />
                  </strong>{' '}
                  tournois
                </div>
                {stats.players > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" aria-hidden />
                    <strong className="text-foreground tabular-nums">
                      <AnimatedCounter value={stats.players} />
                    </strong>{' '}
                    joueur{stats.players > 1 ? 's' : ''}
                  </div>
                )}
                {stats.matchRequests > 0 && (
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" aria-hidden />
                    <strong className="text-foreground tabular-nums">
                      <AnimatedCounter value={stats.matchRequests} />
                    </strong>{' '}
                    annonce{stats.matchRequests > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Indicateur "scroll vers le bas" — discret, anime un peu */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted-foreground"
          aria-hidden
        >
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
