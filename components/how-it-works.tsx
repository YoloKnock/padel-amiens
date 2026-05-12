// ============================================
// Section "Comment ça marche" — 3 étapes
// ============================================
// Pattern classique des landing pages SaaS : 3 cards en ligne qui expliquent
// le produit en 3 verbes. On utilise framer-motion `whileInView` pour
// animer chaque card avec un délai progressif quand la section devient
// visible — effet "wow" léger sans en faire trop.

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarSearch, MessageCircle, Trophy } from 'lucide-react';

interface Step {
  number: string;
  icon: typeof Trophy;
  title: string;
  description: string;
  href: string;
  cta: string;
  /** Classes Tailwind pour l'icône (gradient de fond + couleur de texte) */
  accent: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Trophy,
    title: 'Choisis ton tournoi',
    description:
      "On agrège tous les P25, P50, P100 homologués FFT autour d'Amiens. Filtrés par catégorie, genre, distance et créneau.",
    href: '/',
    cta: 'Voir les tournois',
    accent: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
  {
    number: '02',
    icon: CalendarSearch,
    title: 'Réserve un créneau',
    description:
      "Date + heure + zone, et on t'envoie directement sur la plateforme de réservation du centre (Playtomic, site du club).",
    href: '/jouer',
    cta: 'Trouver un terrain',
    accent: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Trouve un partenaire',
    description:
      "Poste une annonce ou réponds à celles des autres joueurs locaux. Pas de scraping, pas de spam, juste la vraie communauté padel d'Amiens.",
    href: '/matchs',
    cta: 'Chercher un partenaire',
    accent: 'bg-gradient-to-br from-amber-500 to-orange-600',
  },
];

export function HowItWorks() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Comment ça marche</h2>
        <p className="text-muted-foreground">
          Trois actions essentielles, regroupées en un seul endroit.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              href={step.href}
              className="group block h-full bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-md ${step.accent}`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-3xl font-black text-slate-200 group-hover:text-emerald-200 transition-colors">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
              <div className="text-sm font-medium text-emerald-700 group-hover:text-emerald-800 inline-flex items-center gap-1">
                {step.cta}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
