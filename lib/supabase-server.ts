// ============================================
// Client Supabase server-only (avec cookies)
// ============================================
// Fichier séparé de `lib/supabase.ts` parce que `next/headers` ne peut
// PAS être importé depuis du code qui finit dans le bundle client. Mettre
// `cookies()` dans le module partagé suffit à casser le build des pages
// 'use client' qui importent `createBrowserClient`.
//
// Règle simple : tout ce qui appelle `cookies()`, `headers()`, ou autre
// API server-only de Next.js, va dans ce fichier — qui ne doit jamais
// être importé depuis un composant 'use client'.

import {
  createServerClient as createServerClientBase,
  type CookieOptions,
} from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Client Supabase côté serveur (server components + API routes).
 * Lit/écrit les cookies Supabase pour propager la session de l'utilisateur
 * authentifié. Nécessaire pour vérifier qu'on parle bien à un admin connecté.
 *
 * Doc : https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Dans un server component pur, set/remove peuvent throw (cookies
          // en lecture seule). On catch silencieusement : Supabase gère ça.
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            /* read-only context, ignoré */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            /* read-only context, ignoré */
          }
        },
      },
    }
  );
}
