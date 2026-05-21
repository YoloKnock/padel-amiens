// ============================================
// Card d'annonce de partenaire — listing /matchs
// ============================================
// Affichage public. Pas de contact direct ici : pour ça l'utilisateur doit
// cliquer sur la card → /matchs/[id] qui vérifie qu'il est connecté.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  differenceInCalendarDays,
  differenceInHours,
  format,
  formatDistanceToNow,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  Flame,
  MapPin,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from './avatar';
import { cn } from '@/lib/utils';
import type { MatchRequestRow } from '@/app/matchs/page';

interface MatchRequestCardProps {
  request: MatchRequestRow;
  index?: number;
  /** ID de l'utilisateur connecté. Si égal à `request.profile_id`, on
   *  affiche le bouton "Retirer mon annonce" sur la card. */
  currentUserId?: string | null;
}

export function MatchRequestCard({
  request,
  index = 0,
  currentUserId,
}: MatchRequestCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const date = parseISO(request.when_date);
  const formattedDate = format(date, 'EEEE d MMMM yyyy', { locale: fr });
  const isOwner = currentUserId === request.profile_id;

  // Fraîcheur de l'annonce : "il y a 2h", "il y a 3 jours"...
  // Signal social fort : une annonce postée il y a 1h, ça donne envie de
  // répondre vite. Postée il y a 3 semaines, on hésite davantage.
  // Variante "NEW" pour les annonces < 24h : badge orange clignotant
  // discret pour attirer l'œil.
  const createdAt = parseISO(request.created_at);
  const postedAgo = formatDistanceToNow(createdAt, { locale: fr, addSuffix: true });
  const isFresh = differenceInHours(new Date(), createdAt) < 24;

  // Urgence du match : si la date du match est dans les 3 prochains jours,
  // on met un badge "Bientôt" qui crée de l'urgence saine.
  const daysUntilMatch = differenceInCalendarDays(date, new Date());
  const isSoon = daysUntilMatch >= 0 && daysUntilMatch <= 3;

  async function handleDelete(e: React.MouseEvent) {
    // Empêche le click de propager vers le stretched link "Contacter"
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Retirer cette annonce ?')) return;

    setDeleting(true);
    const response = await fetch(`/api/match-requests?id=${request.id}`, {
      method: 'DELETE',
    });
    setDeleting(false);

    if (!response.ok) {
      toast.error('Suppression échouée');
      return;
    }
    toast.success('Annonce retirée');
    router.refresh();
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className={cn(
        'group relative bg-white rounded-xl border p-5 transition-all',
        // Bordure légèrement teintée orange pour les matchs "bientôt" :
        // attire l'œil sur les annonces urgentes sans être tape-à-l'œil.
        isSoon
          ? 'border-amber-200 hover:shadow-xl hover:border-amber-300 hover:shadow-amber-100/60'
          : 'border-slate-200 hover:shadow-xl hover:border-emerald-300 hover:shadow-emerald-100/60'
      )}
    >
      {/* Header : avatar + pseudo (cliquable -> /joueur/[pseudo]) + ville + badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            url={request.profile_avatar_url}
            name={request.profile_pseudo}
            size="md"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-base flex items-center gap-2 flex-wrap">
              <Link
                href={`/joueur/${encodeURIComponent(request.profile_pseudo)}`}
                className="relative z-10 hover:text-emerald-700 transition-colors"
              >
                {request.profile_pseudo}
              </Link>
              {isOwner && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                  Toi
                </span>
              )}
              {/* Badge "Nouveau" pour les annonces < 24h : signal de fraîcheur */}
              {isFresh && !isOwner && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold uppercase tracking-wide">
                  <Flame className="w-2.5 h-2.5" />
                  Nouveau
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
              {request.profile_city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden />
                  {request.profile_city}
                </span>
              )}
              {/* "Posté il y a Xh" — signal de fraîcheur, toujours visible */}
              <span className="text-muted-foreground/70">·</span>
              <span title={format(createdAt, 'd MMMM yyyy à HH:mm', { locale: fr })}>
                {postedAgo}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {request.profile_level && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
              {request.profile_level}
            </span>
          )}
          {/* Badge urgence : "Bientôt" si match dans <= 3 jours */}
          {isSoon && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold uppercase tracking-wide whitespace-nowrap">
              {daysUntilMatch === 0
                ? "Aujourd'hui"
                : daysUntilMatch === 1
                ? 'Demain'
                : `Dans ${daysUntilMatch}j`}
            </span>
          )}
        </div>
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

      {/* CTA contextuel : "Contacter" pour les autres, "Voir + retirer" pour l'owner.
          Stretched link sur le CTA principal pour rendre la card cliquable. */}
      {isOwner ? (
        <div className="flex gap-2 mt-2">
          <Link
            href={`/matchs/${request.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors after:absolute after:inset-0 after:content-['']"
          >
            Voir
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="relative z-10 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            title="Retirer mon annonce"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Retirer</span>
          </button>
        </div>
      ) : (
        <Link
          href={`/matchs/${request.id}`}
          className="inline-flex items-center justify-center gap-2 w-full mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors after:absolute after:inset-0 after:content-['']"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Contacter
        </Link>
      )}
    </motion.article>
  );
}
