// ============================================
// Calculs géographiques
// ============================================
// Pour filtrer les tournois par distance autour d'Amiens.

import { REFERENCE_POINT } from './constants';

/**
 * Calcule la distance (en km) entre deux points GPS via la formule haversine.
 *
 * Pourquoi haversine et pas une lib externe ?
 * → C'est ~10 lignes, ça suffit largement pour un filtre "à 50 km autour de moi".
 *   Une lib comme geolib pour ce besoin serait surengineering.
 */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // rayon de la Terre en km

  // Conversion degrés → radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Distance entre Amiens Padel (Cagny) et un point GPS.
 * Retourne null si les coordonnées du point ne sont pas définies.
 */
export function distanceFromAmiens(
  lat: number | null,
  lng: number | null
): number | null {
  if (lat === null || lng === null) return null;
  return distanceKm(
    REFERENCE_POINT.latitude,
    REFERENCE_POINT.longitude,
    lat,
    lng
  );
}

/**
 * Extrait le département depuis un code postal français (2 premiers chiffres).
 * Pour les DROM (97x), retourne le code complet sur 3 chiffres.
 */
export function departmentFromPostalCode(postalCode: string | null): string | null {
  if (!postalCode) return null;
  const cleaned = postalCode.replace(/\s/g, '');
  if (cleaned.startsWith('97') || cleaned.startsWith('98')) {
    return cleaned.substring(0, 3);
  }
  return cleaned.substring(0, 2);
}

// ============================================
// Géocodage via l'API gouvernementale (BAN)
// ============================================
// Pourquoi cette API plutôt que Mapbox/Google ?
// → Gratuite, sans clé, illimitée pour un usage raisonnable, données officielles
//   françaises (Base Adresse Nationale). Précision niveau adresse en France
//   métropolitaine. Doc : https://adresse.data.gouv.fr/api-doc/adresse

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/**
 * Géocode une adresse libre (rue, code postal, ville) en coordonnées GPS.
 * Retourne null si l'API ne trouve rien ou si erreur réseau.
 *
 * En pratique on appelle ça avec "code_postal ville" si on n'a pas la rue,
 * ce qui suffit pour notre filtre "à X km de Cagny" (précision ville).
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(trimmed)}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`[geocode] HTTP ${response.status} pour "${trimmed}"`);
      return null;
    }

    const data = (await response.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    };
    const coordinates = data.features?.[0]?.geometry?.coordinates;
    if (!coordinates) return null;

    // Convention GeoJSON : [longitude, latitude]
    const [lng, lat] = coordinates;
    return { latitude: lat, longitude: lng };
  } catch (error) {
    console.warn(`[geocode] Erreur fetch pour "${trimmed}":`, error);
    return null;
  }
}
