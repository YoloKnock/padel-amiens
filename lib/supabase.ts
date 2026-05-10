// ============================================
// Clients Supabase — versions safe-anywhere
// ============================================
// Ce module n'importe RIEN de `next/headers` — il peut donc être importé
// depuis du code client comme serveur. Si tu as besoin de lire la session
// utilisateur côté serveur (cookies), va voir `lib/supabase-server.ts`.

import { createBrowserClient as createBrowserClientBase } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase côté navigateur (lecture publique + auth utilisateur).
 * À utiliser dans les composants React avec 'use client'.
 */
export function createBrowserClient() {
  return createBrowserClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Client Supabase admin avec service_role key.
 * ⚠️ NE JAMAIS exposer côté client. Bypass la Row Level Security.
 *
 * Utilisé pour :
 *   - Le scraper (API route /api/cron/scrape-tournaments)
 *   - Le script local scripts/scrape-once.ts
 *   - Les opérations admin sur events (insert/update/delete via /api/events)
 *
 * Pas d'usage de cookies/headers ici, donc safe à importer côté client en
 * théorie — mais l'env SUPABASE_SERVICE_ROLE_KEY n'est de toute façon pas
 * exposée côté browser, donc l'appel échouera. Garde cet appel server-side.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
