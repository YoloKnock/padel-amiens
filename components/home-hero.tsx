// ============================================
// Hero de la home — layout asymétrique pro
// ============================================
// Refonte après retour Hugo : "image pas terrible, pixelisée, pense à la
// card par-dessus". Nouveau parti-pris :
//
//   Desktop : layout SPLIT côte à côte.
//     - Gauche  : contenu (texte + CTAs + stats) sur fond blanc/glass
//     - Droite  : grande photo padel haute qualité, bien visible
//   Mobile  : photo en background douce (flou subtil) + contenu par-dessus
//
// Avantages :
//   1. La photo n'est plus "cachée derrière une card" — elle a son propre
//      espace dédié à droite
//   2. Le texte vit dans son espace tranquille à gauche, parfaitement
//      lisible (pas besoin d'overlay lourd)
//   3. Pattern qu'on voit sur Anybuddy, Airbnb, Stripe — éprouvé

'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  MessageCircle,
  Search,
  Trophy,
  Users,
} from 'lucide-react';

import { AnimatedCounter } from './animated-counter';
import { LinkButton } from './ui/button';

// Photo source : Wikimedia Commons — Vigo Open 2019 du World Padel Tour.
// Choix volontaire (vs un SVG ou Unsplash) :
//   - C'est une VRAIE photo de padel, prise en compétition pro (WPT).
//   - On voit clairement la balle en l'air + parois vitrées + sol bleu :
//     impossible de confondre avec du tennis/badminton.
//   - Licence Creative Commons sur Wikimedia Commons (réutilisable).
//   - Hostée sur upload.wikimedia.org (CDN ultra-fiable, pas de risque
//     de hotlink-block comme certains sites de clubs).
const HERO_PADEL_PHOTO =
  'https://upload.wikimedia.org/wikipedia/commons/e/ee/Vigo_Open_2019_de_World_Padel_Tour_-_38.jpg';

interface HomeHeroProps {
  stats: {
    tournaments: number;
    players: number;
    matchRequests: number;
  };
}

// ============================================
// Seuils d'affichage des stats — anti "site vide"
// ============================================
// Un visiteur qui voit "3 joueurs" se dit "personne n'utilise ce truc".
// On masque les compteurs jusqu'à ce qu'ils soient crédibles. Tournois
// est toujours affiché parce qu'il vient du scraper FFT (toujours rempli).
const STAT_THRESHOLDS = {
  players: 10,
  matchRequests: 3,
};

export function HomeHero({ stats }: HomeHeroProps) {
  // Stats à afficher dans la rangée de pills (filtre seuils)
  const showPlayers = stats.players >= STAT_THRESHOLDS.players;
  const showMatchRequests = stats.matchRequests >= STAT_THRESHOLDS.matchRequests;

  return (
    <section className="relative overflow-hidden border-b border-slate-200">
      {/* Background pattern subtil — décoratif uniquement */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15),_transparent_50%)]"
        aria-hidden
      />

      <div className="container relative mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ============================================
              Colonne GAUCHE : contenu
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10"
          >
            {/* Pill catégorie */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium mb-5">
              <Trophy className="w-3.5 h-3.5" aria-hidden />
              Tournois FFT · Amiens & Hauts-de-France
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              Le padel local,{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                tout en un.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg">
              Tournois FFT, créneaux dispos, partenaires de jeu — tout au
              même endroit, gratuit, et 100% local.
            </p>

            {/* CTAs primaires — migrés vers <LinkButton /> pour cohérence
                avec le reste de l'app. Le primary garde son look distinctif
                (shadow + hover translate) via la variante "primary". */}
            <div className="flex flex-wrap gap-3 mb-8">
              <LinkButton href="/tournois" variant="primary" size="lg" className="rounded-full">
                <Trophy className="w-4 h-4" aria-hidden />
                Voir les tournois
              </LinkButton>
              <LinkButton href="/jouer" variant="secondary" size="lg" className="rounded-full">
                <Search className="w-4 h-4" aria-hidden />
                Trouver un créneau
              </LinkButton>
              <LinkButton href="/matchs" variant="secondary" size="lg" className="rounded-full">
                <MessageCircle className="w-4 h-4" aria-hidden />
                Un partenaire
              </LinkButton>
            </div>

            {/* Compteurs en pills discrètes, animés au mount.
                Filtre par seuil (cf. STAT_THRESHOLDS) pour éviter le
                signal "vide" sur les premiers compteurs. */}
            <div className="flex flex-wrap gap-3">
              <Stat icon={Calendar} value={stats.tournaments} label="tournois" />
              {showPlayers && (
                <Stat icon={Users} value={stats.players} label="joueurs" />
              )}
              {showMatchRequests && (
                <Stat
                  icon={MessageCircle}
                  value={stats.matchRequests}
                  label={stats.matchRequests > 1 ? 'annonces' : 'annonce'}
                />
              )}
            </div>
          </motion.div>

          {/* ============================================
              Colonne DROITE : photo haute qualité, bord arrondi
              ============================================
              Cachée sur mobile et tablette (lg:block) pour laisser respirer
              le contenu en colonne unique. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="hidden lg:block relative"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-slate-900">
              {/* Vraie photo : joueur en action sur court de padel (Vigo Open
                  WPT 2019). Cf. constante HERO_PADEL_PHOTO en haut du fichier
                  pour le pourquoi de ce choix. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_PADEL_PHOTO}
                alt="Joueur de padel en compétition sur un court avec parois vitrées"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              {/* Léger gradient bottom pour faire respirer les pastilles
                  flottantes et améliorer la lisibilité (sans assombrir la
                  photo qui est déjà bien). */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"
                aria-hidden
              />
              {/* Pastilles flottantes : preuves sociales discrètes.
                  Idem que les Stat pills : on masque "Communauté locale"
                  tant qu'on n'a pas atteint le seuil — pas crédible avec
                  3 joueurs. À la place, on garde "Tous les centres locaux"
                  qui est factuel et toujours vrai. */}
              <FloatingPill
                className="top-6 left-6"
                icon={Trophy}
                text={`${stats.tournaments} tournois FFT`}
              />
              <FloatingPill
                className="bottom-6 right-6"
                icon={Users}
                text={showPlayers ? 'Communauté locale' : 'Tous les centres d\'Amiens'}
              />
            </div>

            {/* Mini visuel décoratif sous l'image (forme abstraite emerald) */}
            <div
              className="absolute -bottom-8 -left-8 w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 -z-10"
              aria-hidden
            />
            <div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 opacity-15 -z-10"
              aria-hidden
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Sous-composant : Stat pill avec compteur animé
// ============================================
function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Trophy;
  value: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm">
      <Icon className="w-4 h-4 text-emerald-600" aria-hidden />
      <strong className="text-foreground tabular-nums">
        <AnimatedCounter value={value} />
      </strong>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

// ============================================
// Pastilles flottantes sur la photo droite (effet "social proof")
// ============================================
function FloatingPill({
  className = '',
  icon: Icon,
  text,
}: {
  className?: string;
  icon: typeof Trophy;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className={`absolute inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg text-xs font-medium ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
      {text}
    </motion.div>
  );
}
