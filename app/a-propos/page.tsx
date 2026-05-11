// ============================================
// Page À propos — /a-propos
// ============================================
// Transparence sur le projet : qui le porte, pourquoi, comment c'est financé,
// vers où ça va. Utile pour la confiance des visiteurs (et pour le SEO local
// qui aime les pages "About" bien étoffées).

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Globe,
  Heart,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'Padel Amiens est un projet indépendant qui agrège les tournois homologués FFT ' +
    'et les événements padel autour d\'Amiens. Gratuit, légal, communautaire.',
  alternates: { canonical: '/a-propos' },
};

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">À propos</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Padel Amiens est un projet indépendant porté par un padelist amiénois.
          L&apos;objectif : simplifier la vie des joueurs de la région en agrégeant tout
          ce qu&apos;il faut pour jouer — à un seul endroit, gratuit, sans pub.
        </p>

        {/* ============================================
            Ce qu'on fait
            ============================================ */}
        <section className="mb-10 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Ce qu&apos;on fait
          </h2>
          <Item icon={Trophy} title="Calendrier des tournois homologués FFT">
            On scrape automatiquement les pages publiques de Padel Magazine (partenaire
            FFT) pour le calendrier complet des P25, P50, P100 et plus sur les
            Hauts-de-France. Mise à jour quotidienne.
          </Item>
          <Item icon={Search} title="Trouver un terrain libre">
            Sur <Link href="/jouer" className="text-emerald-700 underline">/jouer</Link>,
            tu choisis date / heure / distance et on te redirige vers la plateforme
            officielle (Playtomic, site du club) pour voir les vraies dispos en temps réel.
            On ne stocke aucune dispo — pas de risque de te dire « libre » sur un créneau
            déjà pris.
          </Item>
          <Item icon={Users} title="Americano & événements communautaires">
            Les organisateurs locaux peuvent saisir leurs Americano, portes ouvertes,
            initiations et stages via notre back-office. Pas de scraping illégal d&apos;Instagram —
            uniquement de la saisie volontaire.
          </Item>
        </section>

        {/* ============================================
            Pourquoi
            ============================================ */}
        <section className="mb-10 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            Pourquoi ce projet ?
          </h2>
          <p className="text-muted-foreground">
            Le padel explose à Amiens et en Picardie, mais l&apos;info reste éclatée
            entre la FFT, Padel Magazine, Playtomic, Instagram, les sites des centres,
            les groupes Facebook... On perd 15 minutes à chaque fois qu&apos;on veut
            juste savoir ce qui se passe ce week-end.
          </p>
          <p className="text-muted-foreground">
            Padel Amiens centralise tout ça sur une seule URL, filtrable, avec
            redirection vers les sources officielles pour les actions (inscription,
            réservation). Pas de pub, pas de monétisation, pas de revente de données.
          </p>
        </section>

        {/* ============================================
            Nos engagements
            ============================================ */}
        <section className="mb-10 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Nos engagements
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">Tout est légal</strong> : on agrège
              uniquement des données publiques. Aucune base de données privée n&apos;est
              scrapée. Les inscriptions et réservations passent toujours par les
              plateformes officielles.
            </li>
            <li>
              <strong className="text-foreground">Gratuit, sans pub</strong> :
              actuellement le projet tourne sur les plans gratuits de Vercel et
              Supabase. Si les coûts montent un jour, on cherchera un modèle qui ne
              passe pas par la pub intrusive.
            </li>
            <li>
              <strong className="text-foreground">Minimum de données</strong> : aucun
              compte utilisateur public pour l&apos;instant. Les analytics sont anonymes
              (Vercel Analytics, sans cookie). Les coordonnées des clubs affichées sont
              celles que les centres publient déjà publiquement.
            </li>
            <li>
              <strong className="text-foreground">Pas affilié à la FFT</strong> :
              Padel Amiens est un projet citoyen indépendant. Les inscriptions
              officielles se font via{' '}
              <a
                href="https://tenup.fft.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline"
              >
                Ten&apos;Up
              </a>{' '}
              uniquement.
            </li>
          </ul>
        </section>

        {/* ============================================
            Contact
            ============================================ */}
        <section className="mb-10 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-600" />
            Contact
          </h2>
          <p className="text-muted-foreground">
            Une suggestion, un centre manquant, un bug, ou tu es un club qui veut
            qu&apos;on te retire (ou qu&apos;on te mette mieux en avant) ?{' '}
            <a
              href="mailto:contact@padel-amiens.fr"
              className="text-emerald-700 underline hover:text-emerald-800"
            >
              contact@padel-amiens.fr
            </a>
          </p>
        </section>

        {/* ============================================
            Tech / Open source future
            ============================================ */}
        <section className="mb-10 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-600" />
            Sous le capot
          </h2>
          <p className="text-muted-foreground">
            Le site est construit avec Next.js, hébergé sur Vercel, base de données
            Supabase en région Europe. Géocodage via l&apos;API Adresse du
            gouvernement français. Carte via OpenStreetMap. Aucun service tiers
            qui te traque.
          </p>
        </section>

        <div className="pt-4 border-t border-slate-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}

// ============================================
// Bloc d'item avec icône, titre, description
// ============================================
function Item({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Trophy;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
      <div>
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
