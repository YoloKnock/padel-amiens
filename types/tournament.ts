// ============================================
// Types & schémas Zod pour les tournois
// ============================================
// Zod nous permet de valider les données scrapées (qui sont par nature non fiables)
// avant de les insérer en DB, ET de dériver automatiquement les types TypeScript.

import { z } from 'zod';

// Catégories de tournois homologués FFT (saison 2026)
export const CATEGORIES = ['P25', 'P50', 'P100', 'P250', 'P500', 'P1000', 'P1500', 'P2000'] as const;
export type Category = (typeof CATEGORIES)[number];

// Genres d'épreuves
export const GENDERS = ['messieurs', 'dames', 'mixte'] as const;
export type Gender = (typeof GENDERS)[number];

// ============================================
// Schéma d'un club
// ============================================
export const ClubSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  address: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  contact_email: z.string().email().nullable(),
  contact_phone: z.string().nullable(),
});

export type Club = z.infer<typeof ClubSchema>;

// ============================================
// Schéma d'un tournoi
// ============================================
export const TournamentSchema = z.object({
  id: z.string().uuid().optional(), // généré par Postgres
  club_id: z.string(),
  category: z.enum(CATEGORIES),
  gender: z.enum(GENDERS),
  title: z.string().min(1),
  start_date: z.string(), // format ISO YYYY-MM-DD
  end_date: z.string().nullable(),
  referee: z.string().nullable(),
  registration_url: z.string().url().nullable(),
  source: z.string().default('padelmagazine'),
  fingerprint: z.string(),
});

export type Tournament = z.infer<typeof TournamentSchema>;

// ============================================
// Schéma d'un tournoi enrichi avec son club
// (utilisé pour la vue upcoming_tournaments)
// ============================================
export const TournamentWithClubSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(CATEGORIES),
  gender: z.enum(GENDERS),
  title: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  referee: z.string().nullable(),
  registration_url: z.string().nullable(),
  club_id: z.string().nullable(),
  club_name: z.string().nullable(),
  club_city: z.string().nullable(),
  club_postal_code: z.string().nullable(),
  club_lat: z.number().nullable(),
  club_lng: z.number().nullable(),
  club_email: z.string().nullable(),
  club_phone: z.string().nullable(),
});

export type TournamentWithClub = z.infer<typeof TournamentWithClubSchema>;
