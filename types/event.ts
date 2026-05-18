// ============================================
// Types & schémas Zod pour les événements non-homologués
// ============================================
// Tournois Americano, journées portes ouvertes, initiations, stages :
// tout ce qui n'est PAS un tournoi homologué FFT et qu'on saisit
// manuellement via le back-office.
//
// Les schémas Zod valident à la fois ce qui rentre via le formulaire admin
// et ce qui ressort de la DB. Les types TS sont dérivés directement.

import { z } from 'zod';

// Types d'événements supportés — synchronisés avec la contrainte CHECK
// définie dans supabase/schema.sql sur la colonne event_type
export const EVENT_TYPES = [
  'americano',
  'portes_ouvertes',
  'initiation',
  'stage',
  'autre',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Libellés affichés aux utilisateurs (le code stocke le slug, l'UI montre le label)
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  americano: 'Americano',
  portes_ouvertes: 'Portes ouvertes',
  initiation: 'Initiation',
  stage: 'Stage',
  autre: 'Autre',
};

// Statuts de modération — synchronisés avec la CHECK constraint en DB
export const EVENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

// ============================================
// Schéma de saisie (formulaire admin)
// ============================================
// On valide ici les champs venant du formulaire avant insert/update.
// Les champs purement DB (id, created_at, etc.) sont gérés par Supabase.
export const EventInputSchema = z.object({
  event_type: z.enum(EVENT_TYPES),
  club_id: z.string().min(1, 'Club obligatoire'),
  title: z.string().min(3, 'Titre trop court').max(200),
  description: z.string().max(2000).nullable().optional(),
  level: z.string().max(100).nullable().optional(),
  // Dates au format ISO YYYY-MM-DD (input type="date" natif)
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  schedule: z.string().max(100).nullable().optional(),
  price: z.string().max(100).nullable().optional(),
  // L'URL peut être vide (string vide) ou une vraie URL — on accepte les deux
  registration_url: z
    .union([z.literal(''), z.string().url()])
    .nullable()
    .optional(),
  contact_email: z
    .union([z.literal(''), z.string().email()])
    .nullable()
    .optional(),
  contact_phone: z.string().max(20).nullable().optional(),
  status: z.enum(EVENT_STATUSES).default('draft'),
});

export type EventInput = z.infer<typeof EventInputSchema>;

// ============================================
// Schéma de l'event tel qu'il vient de la DB (vue upcoming_events)
// ============================================
// Cette forme est utilisée côté frontend public pour l'affichage.
// Joint déjà les infos club, comme upcoming_tournaments.
export const EventWithClubSchema = z.object({
  id: z.string().uuid(),
  event_type: z.enum(EVENT_TYPES),
  title: z.string(),
  description: z.string().nullable(),
  level: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  schedule: z.string().nullable(),
  price: z.string().nullable(),
  registration_url: z.string().nullable(),
  event_contact_email: z.string().nullable(),
  event_contact_phone: z.string().nullable(),
  club_id: z.string().nullable(),
  club_name: z.string().nullable(),
  club_city: z.string().nullable(),
  club_postal_code: z.string().nullable(),
  club_lat: z.number().nullable(),
  club_lng: z.number().nullable(),
  // Logo + cover du club joint via la vue upcoming_events. Sert à afficher
  // une vignette dans les cards events (americano, stages, etc.).
  club_cover_image_url: z.string().nullable().optional(),
  club_logo_url: z.string().nullable().optional(),
});

export type EventWithClub = z.infer<typeof EventWithClubSchema>;
