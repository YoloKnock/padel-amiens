// ============================================
// Types & schémas Zod pour les alertes tournois
// ============================================

import { z } from 'zod';

import { CATEGORIES, GENDERS } from './tournament';

// ============================================
// Préférences d'alerte stockées en DB
// ============================================
export interface AlertPreferences {
  user_id: string;
  enabled: boolean;
  max_distance_km: number;
  /** Catégories cochées (P25, P50, ...). Vide = pas d'alerte. */
  categories: string[];
  /** Genres cochés. Vide = tous les genres. */
  genders: string[];
  last_sent_at: string | null;
  updated_at: string;
}

// ============================================
// Schéma de mise à jour des préférences (PUT)
// ============================================
export const AlertPreferencesInputSchema = z.object({
  enabled: z.boolean(),
  max_distance_km: z
    .number()
    .int('Distance doit être entière')
    .min(0, 'Distance minimale = 0')
    .max(500, 'Distance maximale = 500'),
  categories: z.array(z.enum(CATEGORIES)),
  genders: z.array(z.enum(GENDERS)),
});

export type AlertPreferencesInput = z.infer<typeof AlertPreferencesInputSchema>;

// ============================================
// Defaults appliqués au premier accès (pas encore de ligne en DB)
// ============================================
export const DEFAULT_ALERT_PREFERENCES: Omit<
  AlertPreferences,
  'user_id' | 'last_sent_at' | 'updated_at'
> = {
  enabled: false, // Opt-in explicite : pas d'alerte sans validation utilisateur
  max_distance_km: 30,
  categories: [], // Vide par défaut → le user doit cocher pour activer
  genders: [], // Vide = tous les genres
};
