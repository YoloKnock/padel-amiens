// ============================================
// Button — composant unifié pour tous les CTAs
// ============================================
// Inspiré shadcn/ui mais simplifié pour notre besoin. Élimine les 8-10
// variantes de bouton qu'on avait éparpillées dans l'app (avec padding,
// rounded, ring incohérents).
//
// Variantes :
//   - primary    : emerald 600 → 700 hover (CTA principaux)
//   - secondary  : bordure slate + fond blanc (CTAs secondaires)
//   - ghost      : transparent + slate-100 hover (actions tertiaires)
//   - destructive: rouge (suppression, retrait)
//   - link       : style texte avec underline subtle
//
// Tailles : sm (~32px haut) / md (~40px) / lg (~48px)
//
// IMPORTANT : ce composant peut servir de <button> OU de <a>/<Link>.
// Le polymorphisme se fait via la prop `asChild` (slot) → on l'évite ici
// pour simplifier. À la place, deux composants : Button + LinkButton.

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
type Size = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-emerald-600/20 hover:shadow-md',
  secondary:
    'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100',
  destructive:
    'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100',
  link:
    'bg-transparent text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline px-0 py-0',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

// Classes communes — animations, focus, disabled. Centralisé pour ne plus
// jamais avoir à répéter "transition-colors hover:bg-emerald-700 disabled:opacity-50"
// dans 30 fichiers.
const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-lg font-medium ' +
  'transition-all duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

// ============================================
// <Button /> — élément <button> natif
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Si true, le bouton prend toute la largeur de son parent */
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', fullWidth, className, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          BASE_CLASSES,
          VARIANT_CLASSES[variant],
          variant !== 'link' && SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);

// ============================================
// <LinkButton /> — pour les <a> et next/link qui doivent ressembler à un bouton
// ============================================
interface LinkButtonProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Si true, ouvre dans un nouvel onglet avec target+rel sécurisé */
  external?: boolean;
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  external,
  className,
  children,
  ...props
}: LinkButtonProps) {
  const classes = cn(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    variant !== 'link' && SIZE_CLASSES[size],
    fullWidth && 'w-full',
    className
  );

  // Pour les URLs externes ou les ancres (#section), on utilise <a> natif
  // — Next.js Link force le client-side routing qui n'est pas pertinent.
  if (external || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || /^https?:\/\//.test(href)) {
    return (
      <a
        href={href}
        className={classes}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Sinon : navigation interne via next/link (préfetch + transition douce)
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
