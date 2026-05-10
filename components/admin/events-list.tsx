// ============================================
// Liste admin des events (toutes statuts)
// ============================================
// Affiche tous les events avec actions inline : toggle publish/draft,
// suppression. Pas de pagination — la limite est gérée côté serveur.
//
// On utilise des PATCH/DELETE optimistes côté client : on call l'API,
// puis on router.refresh() pour récupérer l'état serveur frais.

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { EVENT_TYPE_LABELS, type EventType, type EventStatus } from '@/types/event';
import { cn } from '@/lib/utils';

// Forme minimale fetchée depuis la DB côté server component parent
interface AdminEventRow {
  id: string;
  event_type: EventType;
  title: string;
  status: EventStatus;
  start_date: string;
  end_date: string | null;
  club_id: string | null;
  clubs: { name: string | null; city: string | null } | null;
}

interface AdminEventsListProps {
  events: AdminEventRow[];
}

export function AdminEventsList({ events }: AdminEventsListProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Aucun événement saisi pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {events.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
    </ul>
  );
}

// ============================================
// Ligne event (avec ses propres actions)
// ============================================
function EventRow({ event }: { event: AdminEventRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const date = parseISO(event.start_date);
  const formattedDate = format(date, 'EEEE d MMMM yyyy', { locale: fr });

  const isPublished = event.status === 'published';
  const clubLabel = event.clubs?.name
    ? event.clubs.city
      ? `${event.clubs.name} (${event.clubs.city})`
      : event.clubs.name
    : 'Club inconnu';

  async function togglePublish() {
    setPending(true);
    const newStatus: EventStatus = isPublished ? 'draft' : 'published';

    const response = await fetch(`/api/events?id=${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    setPending(false);

    if (!response.ok) {
      toast.error('Mise à jour échouée');
      return;
    }

    toast.success(isPublished ? 'Dépublié' : 'Publié');
    router.refresh();
  }

  async function deleteEvent() {
    // Double confirmation : un toast peut être manqué, un confirm() est clair
    if (!confirm(`Supprimer définitivement "${event.title}" ?`)) return;

    setPending(true);
    const response = await fetch(`/api/events?id=${event.id}`, {
      method: 'DELETE',
    });
    setPending(false);

    if (!response.ok) {
      toast.error('Suppression échouée');
      return;
    }

    toast.success('Événement supprimé');
    router.refresh();
  }

  return (
    <li className="py-3 flex items-center gap-3">
      {/* Badge statut */}
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0',
          isPublished
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-slate-100 text-slate-600'
        )}
      >
        {isPublished ? 'Publié' : 'Brouillon'}
      </span>

      {/* Infos event */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{event.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {EVENT_TYPE_LABELS[event.event_type]} · {clubLabel} · {formattedDate}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={togglePublish}
          disabled={pending}
          title={isPublished ? 'Dépublier' : 'Publier'}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
        >
          {isPublished ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={deleteEvent}
          disabled={pending}
          title="Supprimer"
          className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}
