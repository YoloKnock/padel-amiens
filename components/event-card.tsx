// ============================================
// Composant Card d'un événement non-homologué
// ============================================
// Variante simplifiée de TournamentCard pour les Americano, portes ouvertes,
// initiations, etc. Différences :
//   - Pas de catégorie FFT (P25/P50/...) mais un type d'event
//   - Affichage du tarif et des horaires libres
//   - Niveau requis (libre) plutôt qu'une catégorie FFT stricte
//
// On reste sur le même style visuel pour préserver la cohérence.

'use client';

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  Tag,
  Users,
} from 'lucide-react';

import { ClubBadge } from './club-badge';
import { cn, formatPhone } from '@/lib/utils';
import { EVENT_TYPE_LABELS, type EventWithClub } from '@/types/event';

interface EventCardProps {
  event: EventWithClub & { distance_km: number | null };
  index?: number;
}

// Couleurs par type d'event — distinctes des couleurs FFT pour éviter la
// confusion visuelle (les Americano ne sont pas des P25)
const EVENT_TYPE_COLORS: Record<string, string> = {
  americano: 'bg-amber-100 text-amber-800 border-amber-200',
  portes_ouvertes: 'bg-sky-100 text-sky-800 border-sky-200',
  initiation: 'bg-rose-100 text-rose-800 border-rose-200',
  stage: 'bg-violet-100 text-violet-800 border-violet-200',
  autre: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function EventCard({ event, index = 0 }: EventCardProps) {
  const date = parseISO(event.start_date);
  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
  const typeColor = EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.autre;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:shadow-xl hover:border-amber-300 hover:shadow-amber-100/60 transition-all"
    >
      {/* Header : badge type + distance */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold',
            typeColor
          )}
        >
          {EVENT_TYPE_LABELS[event.event_type]}
        </span>

        {event.distance_km !== null && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {event.distance_km} km
          </span>
        )}
      </div>

      {/* Titre */}
      <h3 className="font-semibold text-base mb-3 line-clamp-2">{event.title}</h3>

      {/* Date + horaire */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
        <span className="capitalize">{formattedDate}</span>
      </div>
      {event.schedule && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{event.schedule}</span>
        </div>
      )}

      {/* Club + ville via ClubBadge — affiche le logo officiel quand dispo */}
      {event.club_name && (
        <div className="mb-3">
          <ClubBadge
            clubId={event.club_id}
            name={event.club_name}
            city={event.club_city}
            logoUrl={event.club_logo_url}
            distanceKm={event.distance_km}
            clickable={!!event.club_id}
          />
        </div>
      )}

      {/* Niveau + tarif */}
      {event.level && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span>{event.level}</span>
        </div>
      )}
      {event.price && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Tag className="w-4 h-4 flex-shrink-0" />
          <span>{event.price}</span>
        </div>
      )}

      {/* Description (tronquée) */}
      {event.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
          {event.description}
        </p>
      )}

      {/* Contacts spécifiques à l'event (si renseignés) */}
      {(event.event_contact_email || event.event_contact_phone) && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          {event.event_contact_email && (
            <a
              href={`mailto:${event.event_contact_email}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.event_contact_email}</span>
            </a>
          )}
          {event.event_contact_phone && (
            <a
              href={`tel:${event.event_contact_phone}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatPhone(event.event_contact_phone)}</span>
            </a>
          )}
        </div>
      )}

      {/* CTA : redirection vers le site d'inscription (si fourni) */}
      {event.registration_url && (
        <a
          href={event.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          S&apos;inscrire
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </motion.article>
  );
}
