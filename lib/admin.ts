// ============================================
// Helpers d'authentification admin
// ============================================
// On garde l'auth ultra simple : whitelist d'emails dans la variable d'env
// `ADMIN_EMAILS` (séparés par virgule). Quiconque s'authentifie via Magic
// Link avec un email présent dans cette liste devient admin du back-office.
//
// Pourquoi pas un rôle Supabase ou une table `admins` ?
// → On a un seul admin (Hugo) au démarrage. Pas besoin de gestion fine.
//   Le jour où on a 5 admins, on bascule sur une table. Pour l'instant
//   c'est zéro friction côté DB.

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { createServerSupabaseClient } from './supabase-server';

/**
 * Liste blanche des emails autorisés à accéder au back-office /admin.
 * Lue dynamiquement à chaque appel pour qu'un changement de variable d'env
 * sur Vercel soit pris en compte sans redéploiement.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

/**
 * Vérifie si un email donné est dans la liste blanche admin.
 * Case-insensitive : "Hugo@x.com" et "hugo@x.com" sont équivalents.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Récupère l'utilisateur connecté (si admin), null sinon.
 *
 * À appeler depuis un server component ou une API route pour vérifier
 * que la requête vient bien d'un admin authentifié. Retourne null si :
 *   - Pas de session active
 *   - Session active mais email pas dans la whitelist
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  if (!isAdminEmail(user.email)) return null;

  return user;
}

/**
 * Wrapper qui force la redirection vers /admin/login si non-admin.
 *
 * À utiliser comme premier appel dans les server components des pages
 * /admin/* :
 *
 *     export default async function AdminPage() {
 *       const user = await requireAdmin();
 *       // ... à partir d'ici on sait que `user` est un admin connecté
 *     }
 */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) {
    redirect('/admin/login');
  }
  return user;
}
