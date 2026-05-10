// ============================================
// Page Mentions légales
// ============================================
// Obligation légale pour tout site français accessible au public (LCEN 2004).
// Couvre aussi : RGPD, source des données agrégées, non-affiliation FFT.
//
// On reste minimaliste : pas de formulaire de contact ni de cookies tiers
// pour l'instant, donc pas besoin d'une politique de cookies dédiée.

import type { Metadata } from 'next';
import Link from 'next/link';

import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'Mentions légales du site Padel Amiens : éditeur, hébergement, sources des données, politique RGPD.',
  // On exclut cette page du robots — utile mais pas à indexer en priorité
  robots: { index: false, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Mentions légales</h1>

        <div className="prose prose-slate max-w-none space-y-8">
          {/* ============================================
              Éditeur du site
              ============================================ */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Éditeur du site</h2>
            <p className="text-muted-foreground">
              Padel Amiens est un projet personnel non commercial édité par un particulier
              résidant en France. Pour toute question, contact via :{' '}
              <a
                href="mailto:contact@padel-amiens.fr"
                className="text-emerald-700 underline hover:text-emerald-800"
              >
                contact@padel-amiens.fr
              </a>
              .
            </p>
          </section>

          {/* ============================================
              Hébergement
              ============================================ */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Hébergement</h2>
            <p className="text-muted-foreground">
              Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133,
              Covina, CA 91723, États-Unis. La base de données est hébergée par{' '}
              <strong>Supabase</strong> (région Europe).
            </p>
          </section>

          {/* ============================================
              Source des données
              ============================================ */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Source des données</h2>
            <p className="text-muted-foreground">
              Les informations relatives aux tournois (date, catégorie, club organisateur,
              juge-arbitre, coordonnées publiques) sont des données publiques agrégées
              automatiquement depuis{' '}
              <a
                href="https://tournois.padelmagazine.fr/ligues/hauts-de-france"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline hover:text-emerald-800"
              >
                Padel Magazine
              </a>
              , partenaire éditorial de la FFT pour la diffusion du calendrier homologué.
            </p>
            <p className="text-muted-foreground">
              Padel Amiens ne revend ni ne monétise ces données. L&apos;inscription
              effective aux tournois se fait exclusivement sur{' '}
              <a
                href="https://tenup.fft.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline hover:text-emerald-800"
              >
                Ten&apos;Up
              </a>
              , la plateforme officielle de la Fédération Française de Tennis.
            </p>
          </section>

          {/* ============================================
              Non-affiliation FFT
              ============================================ */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Non-affiliation</h2>
            <p className="text-muted-foreground">
              Padel Amiens est un site indépendant. Il n&apos;est ni affilié, ni partenaire,
              ni mandaté par la Fédération Française de Tennis, Padel Magazine, ou les
              clubs mentionnés. Toutes les marques et logos cités restent la propriété de
              leurs détenteurs respectifs.
            </p>
          </section>

          {/* ============================================
              Données personnelles (RGPD)
              ============================================ */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Données personnelles (RGPD)</h2>
            <p className="text-muted-foreground">
              Padel Amiens ne collecte aucune donnée personnelle des visiteurs : pas de
              compte utilisateur, pas de formulaire de contact en ligne, pas de cookies
              publicitaires ou de traçage tiers. Seules des statistiques de fréquentation
              anonymes sont collectées via <strong>Vercel Analytics</strong>, sans cookie
              et sans identifiant individuel.
            </p>
            <p className="text-muted-foreground">
              Les adresses email et numéros de téléphone des clubs affichés sont des
              coordonnées professionnelles publiques, identiques à celles publiées sur
              les sites des organisateurs et la FFT. Tout club souhaitant voir ses
              coordonnées retirées peut nous écrire à l&apos;adresse ci-dessus.
            </p>
          </section>

          {/* ============================================
              Limitation de responsabilité
              ============================================ */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Limitation de responsabilité</h2>
            <p className="text-muted-foreground">
              Les informations diffusées sont fournies à titre informatif, sans garantie
              d&apos;exactitude ni d&apos;exhaustivité. Les dates, catégories et conditions
              d&apos;inscription doivent toujours être vérifiées sur la fiche officielle
              du tournoi avant tout déplacement.
            </p>
          </section>

          {/* Retour accueil */}
          <div className="pt-4">
            <Link
              href="/"
              className="text-sm text-emerald-700 underline hover:text-emerald-800"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
