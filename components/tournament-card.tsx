// ============================================
// Composant Card d'un tournoi
// ============================================
// Affichage d'un tournoi sous forme de card avec :
// - Badge catégorie coloré
// - Date + jour de la semaine
// - Nom du club + distance
// - Contact (email, tel) si dispo
// - Bouton CTA "Voir / S'inscrire" qui renvoie vers la fiche Padel Magazine
//   (où l'utilisateur trouve le lien d'inscription officiel Ten'Up)

'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CalendarDays, ExternalLink, MapPin, Mail, Phone, User } from 'lucide-react';

import { CATEGORY_COLORS } from '@/lib/constants';
import { cn, formatPhone } from '@/lib/utils';
import type { TournamentWithClub } from '@/types/tournament';

interface TournamentCardProps {
  tournament: TournamentWithClub & { distance_km: number | null };
  index?: number;
}

// Mapping genre → libellé affiché
const GENDER_LABELS: Record<string, string> = {
  messieurs: 'Messieurs',
  dames: 'Dames',
  mixte: 'Mixte',
};

export function TournamentCard({ tournament, index = 0 }: TournamentCardProps) {
  const date = parseISO(tournament.start_date);
  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });

  const categoryColor = CATEGORY_COLORS[tournament.category] ?? CATEGORY_COLORS.P100;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all"
    >
      {/* Header : badge catégorie + genre */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold',
              categoryColor
            )}
          >
            {tournament.category}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
            {GENDER_LABELS[tournament.gender] ?? tournament.gender}
          </span>
        </div>

        {tournament.distance_km !== null && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {tournament.distance_km} km
          </span>
        )}
      </div>

      {/* Titre du tournoi — cliquable vers la page détail interne (SEO + UX) */}
      <h3 className="font-semibold text-base mb-3 line-clamp-2">
        <Link
          href={`/tournoi/${tournament.id}`}
          className="hover:text-emerald-700 transition-colors after:absolute after:inset-0 after:content-['']"
        >
          {tournament.title}
        </Link>
      </h3>

      {/* Date */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
        <span className="capitalize">{formattedDate}</span>
      </div>

      {/* Club + ville — nom cliquable vers la fiche club (z-10 pour passer
          au-dessus du stretched-link du titre) */}
      {tournament.club_name && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            {tournament.club_id ? (
              <Link
                href={`/club/${tournament.club_id}`}
                className="relative z-10 font-medium text-foreground hover:text-emerald-700 transition-colors"
              >
                {tournament.club_name}
              </Link>
            ) : (
              <div className="font-medium text-foreground">{tournament.club_name}</div>
            )}
            {tournament.club_city && <div>{tournament.club_city}</div>}
          </div>
        </div>
      )}

      {/* Juge-arbitre */}
      {tournament.referee && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <User className="w-4 h-4 flex-shrink-0" />
          <span>JA : {tournament.referee}</span>
        </div>
      )}

      {/* Contacts — relative z-10 pour rester cliquables par-dessus
          le stretched link du titre qui couvre toute la card */}
      <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 space-y-1.5">
        {tournament.club_email && (
          <a
            href={`mailto:${tournament.club_email}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-700 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{tournament.club_email}</span>
          </a>
        )}
        {tournament.club_phone && (
          <a
            href={`tel:${tournament.club_phone}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-700 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatPhone(tournament.club_phone)}</span>
          </a>
        )}
      </div>

      {/* CTA : redirection vers la fiche tournoi (Padel Magazine puis Ten'Up)
          relative z-10 pour passer au-dessus du stretched link */}
      {tournament.registration_url && (
        <a
          href={tournament.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Voir et s&apos;inscrire
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </motion.article>
  );
}
