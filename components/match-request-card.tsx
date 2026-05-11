// ============================================
// Card d'annonce de partenaire — listing /matchs
// ============================================
// Affichage public. Pas de contact direct ici : pour ça l'utilisateur doit
// cliquer sur la card → /matchs/[id] qui vérifie qu'il est connecté.

'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, MessageCircle, User } from 'lucide-react';

import type { MatchRequestRow } from '@/app/matchs/page';

interface MatchRequestCardProps {
  request: MatchRequestRow;
  index?: number;
}

export function MatchRequestCard({ request, index = 0 }: MatchRequestCardProps) {
  const date = parseISO(request.when_date);
  const formattedDate = format(date, 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all"
    >
      {/* Header : pseudo + ville */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            {request.profile_pseudo}
          </h3>
          {request.profile_city && (
            <p className="text-xs text-muted-foreground mt-1">
              📍 {request.profile_city}
            </p>
          )}
        </div>
        {request.profile_level && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
            {request.profile_level}
          </span>
        )}
      </div>

      {/* Date + heure souhaitées */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="capitalize">{formattedDate}</span>
        </div>
        {request.when_hour && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span>{request.when_hour}</span>
          </div>
        )}
        {request.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span>{request.location}</span>
          </div>
        )}
      </div>

      {/* Niveau recherché */}
      {request.level_wanted && (
        <div className="text-sm text-muted-foreground mb-3">
          <strong className="text-foreground">Cherche :</strong> {request.level_wanted}
        </div>
      )}

      {/* Commentaire libre tronqué */}
      {request.comment && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          “{request.comment}”
        </p>
      )}

      {/* CTA : voir détails (stretched link) */}
      <Link
        href={`/matchs/${request.id}`}
        className="inline-flex items-center justify-center gap-2 w-full mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors after:absolute after:inset-0 after:content-['']"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Contacter
      </Link>
    </motion.article>
  );
}
