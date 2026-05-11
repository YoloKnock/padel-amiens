// ============================================
// Formulaire de connexion — Google OAuth + Email/Password
// ============================================
// Trois méthodes d'auth Supabase combinées :
//   1. Bouton "Continuer avec Google" (1 clic, voie royale)
//   2. Form email + mot de passe avec toggle "signin / signup"
//   3. Magic Link retiré du UI (mais lib/supabase l'expose toujours
//      pour un usage admin futur)
//
// Le param ?next= permet de rediriger vers la page d'origine après login
// (ex: si on cliquait sur /matchs/nouveau sans être logué).

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { createBrowserClient } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [adultConsent, setAdultConsent] = useState(false);

  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/profil';

  // ============================================
  // Google OAuth — Supabase redirige automatiquement vers la page Google
  // de consentement, puis revient sur /auth/callback?code=...
  // ============================================
  async function handleGoogle() {
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Important : le redirectTo doit être présent dans la liste des
        // Redirect URLs autorisées côté Supabase (Auth > URL Configuration).
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setLoading(false);
      console.error('[login] Google OAuth error:', error);
      // Message user-friendly. Si le provider Google n'est pas activé côté
      // Supabase, l'utilisateur ne doit pas voir "active le provider" — on
      // lui propose juste l'alternative email/password.
      toast.error('Connexion Google indisponible pour l\'instant. Utilise email + mot de passe ci-dessous.');
      return;
    }
    // Pas de setLoading(false) ici : la page va être redirigée vers Google
  }

  // ============================================
  // Email + mot de passe (signin OU signup selon le mode)
  // ============================================
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (mode === 'signup' && !adultConsent) {
      toast.error('Tu dois confirmer avoir 16 ans ou plus.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      toast.error('Mot de passe trop court (6 caractères minimum).');
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();

    if (mode === 'signup') {
      // Création de compte. Selon la config Supabase, un email de
      // confirmation peut être envoyé (Confirm email = ON) ou le compte
      // est actif immédiatement (= OFF, recommandé pour notre MVP).
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      // Si confirm email est ON, on attend la confirmation. Sinon, signup
      // renvoie une session directement et on peut rediriger.
      // Supabase ne nous dit pas explicitement laquelle des deux options
      // est active, donc on affiche un état "vérifie ton email" qui couvre
      // les deux cas (l'user peut aussi juste se reconnecter ensuite).
      setSignupSent(true);
      toast.success('Compte créé !');

      // Heuristique : on tente une redirection immédiate. Si confirm email
      // est OFF, la session existe déjà et on bascule sur next.
      setTimeout(() => {
        window.location.href = next;
      }, 800);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (error) {
        toast.error('Email ou mot de passe incorrect.');
        return;
      }
      // Hard refresh pour que les server components voient la session via cookie
      window.location.href = next;
    }
  }

  if (signupSent) {
    return (
      <div className="text-center py-6 space-y-3">
        <Mail className="w-12 h-12 mx-auto text-emerald-600" />
        <p className="text-sm font-medium">Compte créé !</p>
        <p className="text-xs text-muted-foreground">
          Si une confirmation par email est demandée, vérifie ta boîte (et tes spams).
          Sinon tu es déjà connecté, on te redirige…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Bouton Google */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium text-sm"
      >
        <GoogleIcon />
        Continuer avec Google
      </button>

      {/* Séparateur */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-slate-200" />
        ou
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Form email + password */}
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
            placeholder="ton.email@example.com"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium">
              Mot de passe {mode === 'signup' && <span className="text-xs text-muted-foreground">(6 caractères min.)</span>}
            </label>
            {mode === 'signin' && (
              <Link
                href="/login/reset"
                className="text-xs text-emerald-700 underline hover:text-emerald-800"
              >
                Mot de passe oublié ?
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            required
            minLength={mode === 'signup' ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
            placeholder="••••••••"
          />
        </div>

        {/* Confirmation 16+ uniquement à la création */}
        {mode === 'signup' && (
          <label className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
            <input
              type="checkbox"
              checked={adultConsent}
              onChange={(e) => setAdultConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Je confirme avoir <strong>16 ans ou plus</strong> et accepter les{' '}
              <a href="/mentions-legales" className="underline">
                mentions légales
              </a>
              .
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading || (mode === 'signup' && !adultConsent)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
        >
          {loading
            ? 'Patiente…'
            : mode === 'signin'
              ? 'Se connecter'
              : 'Créer mon compte'}
        </button>

        {/* Toggle signin / signup */}
        <p className="text-xs text-center text-muted-foreground pt-2">
          {mode === 'signin' ? (
            <>
              Première fois ici ?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-emerald-700 underline hover:text-emerald-800"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-emerald-700 underline hover:text-emerald-800"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

// ============================================
// Logo Google "G" multicolore — version compacte
// ============================================
// SVG inline plutôt qu'image externe (pas de fetch supplémentaire,
// pas de risque de blocage CSP).
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M16.51 8.91c0-.62-.05-1.21-.16-1.78H8.7v3.42h4.39c-.19 1-.76 1.86-1.61 2.43v2.02h2.6c1.52-1.4 2.4-3.46 2.4-6.09z"
      />
      <path
        fill="#34A853"
        d="M8.7 17c2.21 0 4.06-.73 5.41-1.99l-2.6-2.02c-.72.48-1.65.77-2.81.77-2.16 0-3.99-1.46-4.65-3.42H1.37v2.09C2.71 14.65 5.5 17 8.7 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.05 10.34c-.17-.48-.26-.99-.26-1.52s.09-1.04.26-1.52V5.21H1.37C.5 6.4 0 7.84 0 8.82c0 .98.5 2.42 1.37 3.61l2.68-2.09z"
      />
      <path
        fill="#EA4335"
        d="M8.7 3.58c1.22 0 2.31.42 3.17 1.24l2.31-2.31C12.76.92 10.91.18 8.7.18 5.5.18 2.71 2.35 1.37 5.21l2.68 2.09c.66-1.96 2.49-3.42 4.65-3.72z"
      />
    </svg>
  );
}
