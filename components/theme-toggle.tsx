// ============================================
// Toggle mode clair / sombre
// ============================================
// Bouton qui bascule la classe `dark` sur <html>. Les variables CSS
// shadcn (déjà dans globals.css avec .dark { ... }) prennent le relais
// automatiquement pour toutes les couleurs.
//
// Persistance : localStorage. Détection initiale (clair vs sombre) :
// préférence système (prefers-color-scheme). Anti-FOUC : un petit
// snippet inline dans layout.tsx applique la classe AVANT le render
// React, pour éviter le flash blanc sur mobile en mode sombre.

'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'padel-amiens.theme';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Synchronise depuis localStorage au mount (côté client uniquement)
  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      // Pas de préf stockée : on suit le système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage indisponible : ok, on tourne en session-only */
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  // Tant que pas hydraté, on rend un placeholder pour éviter un mismatch
  // (le serveur ne sait pas la pref dark de l'user)
  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      )}
    </button>
  );
}
