// ============================================
// Utilitaires généraux
// ============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine plusieurs classes Tailwind en gérant intelligemment les conflits.
 * Exemple : cn('p-4', condition && 'p-6') → 'p-6' si condition est vraie.
 *
 * Helper standard de shadcn/ui, utilisé dans tous les composants.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un numéro de téléphone français en groupes de 2 chiffres.
 * Exemple : "0629532527" → "06 29 53 25 27"
 */
export function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length !== 10) return phone;
  return cleaned.replace(/(\d{2})/g, '$1 ').trim();
}

/**
 * Génère un slug propre depuis un nom (utilisé pour les IDs de clubs).
 * Exemple : "Amiens Padel" → "amiens-padel"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')      // remplace tout ce qui n'est pas alphanumérique par -
    .replace(/^-+|-+$/g, '');         // retire les - en début/fin
}
