// ============================================
// Helpers de présentation pour les tournois
// ============================================
// Petites fonctions pures qui dérivent des infos affichables à partir du
// titre brut du tournoi (journée vs soirée) ou de sa date (jour de semaine
// vs week-end). On ne stocke pas ces valeurs en DB pour ne pas dupliquer la
// source de vérité — le titre et la date suffisent.

import { parseISO } from 'date-fns';

// ============================================
// Créneau horaire
// ============================================
// Padel Magazine inclut souvent le créneau dans le titre du tournoi
// ("P100 Hommes en journée", "P50 soirée mixte"). On extrait ces indices
// par regex insensible à la casse.

export type TimeSlot = 'day' | 'evening' | 'night' | 'weekend' | null;

export const TIME_SLOT_LABELS: Record<Exclude<TimeSlot, null>, string> = {
  day: 'Journée',
  evening: 'Soirée',
  night: 'Nuit',
  weekend: 'Week-end',
};

/**
 * Parse le titre d'un tournoi pour en déduire le créneau horaire approximatif.
 * Retourne null si aucun indice n'est trouvé dans le titre.
 *
 * Note : ce parsing est best-effort. Le créneau exact reste sur la fiche
 * officielle du tournoi (lien "Voir et s'inscrire" sur la card).
 */
export function parseTimeSlot(title: string): TimeSlot {
  const lower = title.toLowerCase();

  // Ordre : on commence par les indices les plus spécifiques pour éviter
  // qu'un match plus générique masque le bon (ex: "nuit" avant "soirée"
  // au cas où un titre dirait "soirée nuit").
  if (/\bnuit\b/.test(lower)) return 'night';
  if (/\bsoirée|\bsoir(?:\b|s)/.test(lower)) return 'evening';
  if (/\bjournée|\bjourn[eé]e|\bmatinée|\bmatin\b/.test(lower)) return 'day';
  if (/\bweek[\s-]?end|\bwe\b/.test(lower)) return 'weekend';
  return null;
}

// ============================================
// Jour de la semaine vs week-end
// ============================================
// Utilisé par le filtre "Semaine / Week-end" sur la home.
// Convention JS : 0=dim, 1=lun, …, 6=sam. Week-end = 0 ou 6.

/**
 * Retourne true si la date ISO YYYY-MM-DD correspond à un samedi ou dimanche.
 */
export function isWeekend(dateIso: string): boolean {
  const day = parseISO(dateIso).getDay();
  return day === 0 || day === 6;
}

/**
 * Type des options de filtrage par jour de semaine.
 * `null` = pas de filtre (tous les jours).
 */
export type DayTypeFilter = 'weekday' | 'weekend' | null;

/**
 * Retourne true si la date passe le filtre.
 */
export function matchesDayType(dateIso: string, filter: DayTypeFilter): boolean {
  if (filter === null) return true;
  const isWE = isWeekend(dateIso);
  return filter === 'weekend' ? isWE : !isWE;
}
