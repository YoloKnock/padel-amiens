// ============================================
// Card d'un tournoi — version épurée
// ============================================
// Carte cliquable entière qui redirige vers /tournoi/[id]. CTA secondaire
// "S'inscrire" vers la fiche Padel Magazine. Visuel minimaliste et pro :
// pas d'emoji décoratif, juste le label de catégorie en gros sur le bandeau
// gradient + un trait de couleur sobre. Inspiration: cards Linear / Stripe.

'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Clock,
  ExternalLink,
  User,
} from 'lucide-react';

import { ClubBadge } from './club-badge';
import { FavoriteButton } from './favorite-button';
import { CATEGORY_GRADIENTS } from '@/lib/constants';
import { parseTimeSlot, TIME_SLOT_LABELS } from '@/lib/tournament-helpers';
import { cn } from '@/lib/utils';
import type { TournamentWithClub } from '@/types/tournament';

interface TournamentCardProps {
  tournament: TournamentWithClub & { distance_km: number | null };
  index?: number;
  /** Détermine le comportement du bouton favori : si false, le clic
   *  redirige vers /login plutôt que de tenter un fetch raté. */
  isLoggedIn?: boolean;
}

const GENDER_LABELS: Record<string, string> = {
  messieurs: 'Messieurs',
  dames: 'Dames',
  mixte: 'Mixte',
};

export function TournamentCard({
  tournament,
  index = 0,
  isLoggedIn = false,
}: TournamentCardProps) {
  const date = parseISO(tournament.start_date);
  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
  const categoryGradient =
    CATEGORY_GRADIENTS[tournament.category] ?? CATEGORY_GRADIENTS.P100;

  const timeSlot = parseTimeSlot(tournament.title);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:shadow-emerald-100/60 transition-all flex flex-col"
    >
      {/* Bandeau catégorie : gradient discret, label en gros à gauche, distance à droite.
          Plus d'emoji — design plus pro. */}
      <div
        className={cn(
          'h-14 bg-gradient-to-br relative flex items-center justify-between px-5',
          categoryGradient
        )}
      >
        <span className="text-white font-bold text-lg tracking-wide drop-shadow-sm" aria-hidden>
          {tournament.category}
        </span>
        <span className="text-white/90 text-xs font-medium drop-shadow-sm" aria-hidden>
          {GENDER_LABELS[tournament.gender] ?? tournament.gender}
        </span>
      </div>

      {/* Bouton favori : positionné en absolute top-right par-dessus le
          bandeau. Le z-10 sur le bouton lui-même + e.preventDefault dans
          le handler garantit qu'il échappe au stretched link. */}
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton tournamentId={tournament.id} isLoggedIn={isLoggedIn} />
      </div>

      {/* Stretched link : toute la card est cliquable vers la page détail interne */}
      <Link
        href={`/tournoi/${tournament.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Voir le détail de ${tournament.title}`}
      />

      <div className="p-5 flex-1 flex flex-col">
        {/* Titre du tournoi */}
        <h3 className="font-semibold text-base mb-3 line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {tournament.title}
        </h3>

        {/* Métadonnées : date, heure, club, JA, distance */}
        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 flex-shrink-0" aria-hidden />
            <span className="capitalize">{formattedDate}</span>
          </div>
          {timeSlot && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" aria-hidden />
              <span>{TIME_SLOT_LABELS[timeSlot]}</span>
            </div>
          )}
          {tournament.club_name && (
            /* Vignette club : logo + nom + ville/distance. Cliquable
                vers /club/[id] (z-10 pour échapper au stretched link
                qui couvre toute la card). */
            <ClubBadge
              clubId={tournament.club_id}
              name={tournament.club_name}
              city={tournament.club_city}
              logoUrl={tournament.club_logo_url}
              distanceKm={tournament.distance_km}
              clickable={!!tournament.club_id}
            />
          )}
          {tournament.referee && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 flex-shrink-0" aria-hidden />
              <span>JA : {tournament.referee}</span>
            </div>
          )}
        </div>

        {/* Actions — toujours en bas grâce à mt-auto */}
        <div className="mt-auto pt-3 border-t border-slate-100 space-y-2">
          {/* CTA principal : voir le détail interne (cohérent avec le stretched link) */}
          <div className="relative z-10 inline-flex items-center justify-between w-full text-sm font-medium text-emerald-700 group-hover:text-emerald-800">
            <span>Voir le détail</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </div>

          {/* CTAs secondaires : inscription externe + agenda */}
          <div className="relative z-10 flex flex-wrap gap-2 pt-1">
            {tournament.registration_url && (
              <a
                href={tournament.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-3 h-3" aria-hidden />
                S&apos;inscrire
              </a>
            )}
            <a
              href={`/api/ics/tournoi/${tournament.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              <CalendarPlus className="w-3 h-3" aria-hidden />
              Agenda
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
