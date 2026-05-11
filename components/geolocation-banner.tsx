// ============================================
// Bandeau opt-in pour la géolocalisation utilisateur
// ============================================
// Apparaît en haut des pages /, /jouer si :
//   - L'utilisateur n'a jamais accepté la géoloc
//   - ET l'utilisateur ne l'a pas explicitement dismissée
//
// Une fois la géoloc accordée OU dismissée, la bannière disparaît
// définitivement (persisté en localStorage).

'use client';

import { MapPin, X } from 'lucide-react';

import { useUserLocation } from '@/hooks/use-user-location';

interface GeolocationBannerProps {
  /** Texte d'accroche custom selon le contexte (tournois vs clubs). */
  message?: string;
}

export function GeolocationBanner({
  message = 'Active ta position pour voir les tournois autour de toi (au lieu de Cagny par défaut).',
}: GeolocationBannerProps) {
  const { shouldShowBanner, loading, requestGeolocation, dismiss } = useUserLocation();

  if (!shouldShowBanner) return null;

  return (
    <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
      <MapPin className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-medium text-emerald-900">📍 Personnaliser pour toi</p>
        <p className="text-emerald-800 mt-0.5">{message}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={requestGeolocation}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Localisation…' : 'Activer'}
        </button>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
          title="Plus tard"
          aria-label="Plus tard"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
