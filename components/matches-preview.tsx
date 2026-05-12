// ============================================
// Aperçu des dernières annonces matchs sur la home
// ============================================
// Affiche les 3 annonces les plus récentes pour donner du signal de vie à
// la communauté. Si y'en a moins de 3, on cache la section entièrement
// (mieux que de montrer "1 annonce" qui paraît mort).

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';

import { MatchRequestCard } from './match-request-card';
import type { MatchRequestRow } from '@/app/matchs/page';

interface MatchesPreviewProps {
  requests: MatchRequestRow[];
  currentUserId: string | null;
  totalCount: number;
}

export function MatchesPreview({
  requests,
  currentUserId,
  totalCount,
}: MatchesPreviewProps) {
  // Seuil minimum à 1 — on affiche dès qu'il y a quelque chose. Avec un
  // texte adapté si une seule annonce vs plusieurs.
  if (requests.length === 0) return null;

  const preview = requests.slice(0, 3);

  return (
    <section className="container mx-auto px-4 py-12 md:py-16 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent rounded-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4 mb-8"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-emerald-600" aria-hidden />
            Joueurs qui cherchent un partenaire
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {totalCount === 1
              ? '1 annonce en cours dans la communauté'
              : `${totalCount} annonces en cours dans la communauté`}
            .
          </p>
        </div>
        <Link
          href="/matchs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors group"
        >
          Voir toutes les annonces
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {preview.map((req, i) => (
          <MatchRequestCard
            key={req.id}
            request={req}
            index={i}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </section>
  );
}
