// ============================================
// Compteur qui s'incrémente quand il devient visible
// ============================================
// Pattern courant sur les sites modernes (Stripe, Linear, Vercel) : un
// chiffre qui "compte" de 0 jusqu'à sa valeur cible quand l'utilisateur
// scroll dessus. Donne un effet de vie immédiat et attire l'œil.
//
// Implémenté avec framer-motion :
//   - useInView : déclenche quand le node entre dans le viewport
//   - useMotionValue + animate : interpole de 0 à `value` sur ~1.2s
//   - useTransform : convertit le float en entier (Math.round) pour l'affichage

'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  /** Durée de l'animation en secondes (défaut 1.2s) */
  duration?: number;
}

export function AnimatedCounter({ value, duration = 1.2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  // once: true → on n'anime qu'à la première apparition (pas à chaque scroll)
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const count = useMotionValue(0);
  // Arrondi au plus proche entier (pas de "23.7 joueurs")
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, value, {
      duration,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [isInView, value, duration, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
