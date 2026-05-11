// ============================================
// Helpers d'authentification utilisateur (Brique 3 — matchmaking)
// ============================================
// Très proche de lib/admin.ts, mais sans whitelist d'emails : n'importe quel
// utilisateur authentifié via Magic Link a accès aux features matchmaking.
// La modération se fait a posteriori via la table `banned_emails`.

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { createServerSupabaseClient } from './supabase-server';
import { createAdminClient } from './supabase';

/**
 * Retourne l'utilisateur connecté, ou null s'il n'y a pas de session.
 * Pas de redirect ici : à l'appelant de décider.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Vérifie que l'email n'est pas dans la liste noire de modération.
 * On vérifie côté serveur via le service_role (la table banned_emails
 * n'est pas lisible par les clients anon/authenticated).
 */
export async function isBanned(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('banned_emails')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return !!data;
}

/**
 * Wrapper qui force la redirection vers /login si non authentifié,
 * ou vers /banni si l'email est dans la liste noire.
 *
 * À utiliser au début des server components des pages qui nécessitent
 * une session : /profil, /matchs/nouveau, etc.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=' + encodeURIComponent('/profil'));
  if (await isBanned(user.email)) redirect('/banni');
  return user;
}

/**
 * Récupère le profile (table `profiles`) de l'utilisateur connecté.
 * Retourne null si pas encore créé (premier login).
 */
export interface PublicProfile {
  id: string;
  pseudo: string;
  level: string | null;
  city: string | null;
  contact_phone: string | null;
  is_adult: boolean;
}

export async function getCurrentProfile(): Promise<PublicProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, pseudo, level, city, contact_phone, is_adult')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[user] Erreur fetch profile:', error);
    return null;
  }
  return data;
}
