// ============================================
// Hook : useFavorites — gestion des favoris tournois (client)
// ============================================
// Centralise la logique des favoris pour éviter de la dupliquer entre
// FavoriteButton (sur chaque card) et la page /profil → onglet Favoris.
//
// Stratégie :
//   - Cache module-level : un seul fetch GET /api/favorites par session,
//     partagé entre toutes les cards. On évite N requêtes pour N cards.
//   - Optimistic updates : on met à jour le state local AVANT la réponse
//     API. Si l'API échoue, on rollback. UX instantanée.
//   - Subscribers : chaque composant qui consomme le hook s'abonne aux
//     changements du Set. Quand le Set bouge, tous les boutons re-render.
//
// On n'utilise PAS de Context pour éviter le wrapping. Le module-level
// state suffit pour ce besoin (pas de SSR sur les favoris : la liste se
// charge au client uniquement).

'use client';

import { useCallback, useEffect, useState } from 'react';

// ============================================
// State module-level partagé entre tous les consumers du hook
// ============================================
let cachedIds: Set<string> | null = null;
let fetchPromise: Promise<Set<string>> | null = null;
const subscribers = new Set<(ids: Set<string>) => void>();

/** Notifie tous les composants montés que la liste a changé. */
function notify() {
  if (!cachedIds) return;
  // On crée une nouvelle référence de Set pour que React détecte le change.
  const snapshot = new Set(cachedIds);
  for (const fn of subscribers) fn(snapshot);
}

/** Fetch la liste initiale (idempotent : ne retape l'API qu'une fois). */
async function loadFavorites(): Promise<Set<string>> {
  if (cachedIds) return cachedIds;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/favorites', { credentials: 'same-origin' })
    .then(async (res) => {
      if (!res.ok) {
        // Pas connecté ou erreur API : on initialise vide pour ne pas
        // bloquer l'UI. Les boutons resteront en état "non-favori".
        cachedIds = new Set();
        return cachedIds;
      }
      const json = (await res.json()) as { ids?: string[] };
      cachedIds = new Set(json.ids ?? []);
      return cachedIds;
    })
    .catch(() => {
      cachedIds = new Set();
      return cachedIds;
    })
    .finally(() => {
      // Reset la promise pour qu'un futur appel cache hit directement
      fetchPromise = null;
    });

  return fetchPromise;
}

// ============================================
// Hook public
// ============================================
export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(cachedIds ?? new Set());
  const [ready, setReady] = useState(cachedIds !== null);

  // Au mount : load + s'abonner
  useEffect(() => {
    let mounted = true;
    loadFavorites().then((s) => {
      if (mounted) {
        setIds(new Set(s));
        setReady(true);
      }
    });

    subscribers.add(setIds);
    return () => {
      mounted = false;
      subscribers.delete(setIds);
    };
  }, []);

  /** Ajoute un favori avec optimistic update + rollback en cas d'échec. */
  const add = useCallback(async (tournamentId: string) => {
    if (!cachedIds) cachedIds = new Set();
    cachedIds.add(tournamentId);
    notify();

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId }),
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Rollback
      cachedIds.delete(tournamentId);
      notify();
      throw err;
    }
  }, []);

  /** Retire un favori avec optimistic update + rollback. */
  const remove = useCallback(async (tournamentId: string) => {
    if (!cachedIds) cachedIds = new Set();
    cachedIds.delete(tournamentId);
    notify();

    try {
      const res = await fetch(
        `/api/favorites?tournament_id=${encodeURIComponent(tournamentId)}`,
        { method: 'DELETE', credentials: 'same-origin' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Rollback
      cachedIds.add(tournamentId);
      notify();
      throw err;
    }
  }, []);

  /** Toggle : utilitaire pour le bouton (1 fonction au lieu de 2). */
  const toggle = useCallback(
    async (tournamentId: string) => {
      if (cachedIds?.has(tournamentId)) {
        await remove(tournamentId);
        return false;
      }
      await add(tournamentId);
      return true;
    },
    [add, remove]
  );

  return { ids, ready, add, remove, toggle, isFavorite: (id: string) => ids.has(id) };
}
