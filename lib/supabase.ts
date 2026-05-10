// ============================================
// Clients Supabase
// ============================================
// On expose deux clients différents :
// 1. createBrowserClient → utilisé côté client (composants 'use client')
// 2. createServerClient → utilisé côté serveur (API routes, server components)
// 3. createAdminClient → utilisé pour les opérations admin (scraper) — bypass RLS

import { createBrowserClient as createBrowserClientBase } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase côté navigateur (lecture publique seulement).
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
 * Utilisé uniquement par :
 *   - Le scraper (API route /api/cron/scrape-tournaments)
 *   - Le script local scripts/scrape-once.ts
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
