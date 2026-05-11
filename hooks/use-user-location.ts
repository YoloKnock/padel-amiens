// ============================================
// Hook : géolocalisation utilisateur partagée
// ============================================
// Sert deux pages : la home (filtrage tournois) et /jouer (filtrage clubs).
// Avant ce hook, le state était dupliqué dans tournament-list. On centralise
// pour que tout le site partage la même position via localStorage.
//
// Pourquoi ne pas demander la géoloc automatiquement au mount ?
// → Best practice UX : un prompt navigateur surgi sans contexte effraie
//   l'utilisateur (étude classique sur les permissions web). On préfère un
//   bandeau opt-in clair qui explique ce qu'on va faire avec la position.
//   Une fois acceptée, elle est persistée et plus rien à demander.

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'padel-amiens.user-location';
const DISMISS_KEY = 'padel-amiens.geo-dismissed';

export interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restaure la position et l'état "dismissed" au mount (côté client uniquement)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setUserLocation(JSON.parse(stored));
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true');
    } catch {
      /* localStorage indisponible : on tourne sans persistance */
    }
  }, []);

  /**
   * Demande la position au navigateur. Le user verra le prompt natif
   * "Autoriser/Bloquer" et tout est géré ensuite par les callbacks.
   */
  function requestGeolocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Ton navigateur ne supporte pas la géolocalisation.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setDismissed(false);
        setLoading(false);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          window.localStorage.removeItem(DISMISS_KEY);
        } catch {
          /* localStorage plein : on garde l'état en mémoire pour la session */
        }
        toast.success('Position détectée, distances mises à jour.');
      },
      (err) => {
        setLoading(false);
        const reason =
          err.code === err.PERMISSION_DENIED
            ? 'Tu as refusé la géolocalisation.'
            : 'Position indisponible.';
        toast.error(reason);
        // Si l'user a explicitement refusé, on dismiss la bannière pour ne pas
        // re-prompter à chaque page chargée
        if (err.code === err.PERMISSION_DENIED) dismiss();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  function clearGeolocation() {
    setUserLocation(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignoré */
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* ignoré */
    }
  }

  return {
    userLocation,
    dismissed,
    loading,
    requestGeolocation,
    clearGeolocation,
    dismiss,
    /** True si on doit montrer la bannière "Activer la géoloc" */
    shouldShowBanner: !userLocation && !dismissed,
  };
}
