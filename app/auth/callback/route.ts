// ============================================
// Route callback Magic Link — /auth/callback
// ============================================
// L'utilisateur clique sur le lien dans son mail → arrive ici avec un `code`
// en query string. On échange ce code contre une session Supabase, puis on
// redirige vers `?next=...` (par défaut /admin).
//
// Doc Supabase :
// https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr#create-a-route-handler-for-auth-callback

import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  // `next` permet à l'appelant de spécifier où atterrir après login.
  // On force un chemin interne pour éviter une open redirect.
  const nextRaw = url.searchParams.get('next') ?? '/admin';
  const next = nextRaw.startsWith('/') ? nextRaw : '/admin';

  if (!code) {
    // Pas de code → on revoit au login avec un flag d'erreur
    return NextResponse.redirect(new URL('/admin/login?error=missing_code', url.origin));
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] Erreur exchange:', error);
    return NextResponse.redirect(
      new URL('/admin/login?error=invalid_code', url.origin)
    );
  }

  // Session établie : on redirige vers la destination demandée.
  // Si l'email n'est pas dans la whitelist admin, /admin redirigera lui-même
  // vers /admin/login (cf. requireAdmin).
  return NextResponse.redirect(new URL(next, url.origin));
}
