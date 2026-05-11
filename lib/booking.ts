// ============================================
// Helpers de redirection vers les plateformes de réservation
// ============================================
// La logique est volontairement simple : chaque club a un template d'URL
// (stocké en DB) avec des placeholders {name}, {date}, {hour}. On les
// substitue à la volée selon ce que l'utilisateur a saisi dans le widget
// "Je cherche un créneau", puis on lui sert le lien en target=_blank.
//
// On ne stocke AUCUNE dispo. La dispo réelle est celle que l'utilisateur
// voit en arrivant sur la plateforme — toujours fiable, toujours fraîche.

import type { BookableClub, BookingPlatform } from '@/types/tournament';

// Libellés affichés à l'utilisateur (le code stocke le slug, l'UI le label)
export const BOOKING_PLATFORM_LABELS: Record<BookingPlatform, string> = {
  playtomic: 'Playtomic',
  doinsport: 'Doinsport',
  anybuddy: 'Anybuddy',
  custom: 'Site du club',
  none: 'Pas de réservation en ligne',
};

/**
 * Construit l'URL de réservation finale pour un club donné, à une date/heure
 * recherchées. Retourne null si le club n'a pas de plateforme de booking
 * connue (cas 'none' ou template manquant).
 *
 * Les placeholders supportés dans le template :
 *   {name} → nom du club, URL-encoded
 *   {date} → date au format YYYY-MM-DD
 *   {hour} → heure au format HH (24h, ex: "16")
 *
 * Exemple :
 *   template = "https://playtomic.io/search?q={name}&date={date}&hour={hour}"
 *   club = "Amiens Padel"  date = "2026-05-12"  hour = "16"
 *   →  "https://playtomic.io/search?q=Amiens+Padel&date=2026-05-12&hour=16"
 */
export function buildBookingUrl(
  club: Pick<BookableClub, 'name' | 'booking_platform' | 'booking_url_template'>,
  date: string,
  hour: string
): string | null {
  if (!club.booking_url_template || club.booking_platform === 'none') {
    return null;
  }

  return club.booking_url_template
    .replaceAll('{name}', encodeURIComponent(club.name))
    .replaceAll('{date}', date)
    .replaceAll('{hour}', hour);
}

/**
 * Liste des créneaux horaires proposés dans le widget.
 * Padel se joue rarement avant 8h ou après 23h, et toujours par tranches
 * de 1h (un match dure 1h30 mais les créneaux sont 1h chez Playtomic).
 */
export const BOOKING_HOURS: string[] = Array.from({ length: 16 }, (_, i) => {
  const hour = 8 + i; // 8h à 23h
  return hour.toString().padStart(2, '0');
});
