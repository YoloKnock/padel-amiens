// ============================================
// Footer — structuré en colonnes thématiques
// ============================================
// Avant : un seul bloc centré avec 3 paragraphes. Maintenant : layout 4
// colonnes (marque, navigation, ressources, légal) qui donne un look pro
// type Stripe / Linear. Centré + compact sur mobile.

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/50 mt-8">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Marque + tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-bold text-lg mb-3"
            >
              <span className="text-2xl" aria-hidden>
                🎾
              </span>
              <span>Padel Amiens</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs">
              Le padel local, en un seul endroit. Tournois FFT, créneaux dispos,
              et communauté de joueurs autour d&apos;Amiens.
            </p>
          </div>

          {/* Navigation principale */}
          <div>
            <FooterTitle>Naviguer</FooterTitle>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink href="/tournois">Tournois FFT</FooterLink>
              </li>
              <li>
                <FooterLink href="/jouer">Réserver un créneau</FooterLink>
              </li>
              <li>
                <FooterLink href="/matchs">Trouver un partenaire</FooterLink>
              </li>
              <li>
                <FooterLink href="/login">Connexion</FooterLink>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <FooterTitle>Ressources</FooterTitle>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink href="/a-propos">À propos</FooterLink>
              </li>
              <li>
                <ExternalLink href="https://tenup.fft.fr">
                  Ten&apos;Up (FFT)
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://tournois.padelmagazine.fr/ligues/hauts-de-france">
                  Padel Magazine
                </ExternalLink>
              </li>
            </ul>
          </div>

          {/* Contact + légal */}
          <div>
            <FooterTitle>Contact</FooterTitle>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contact@padel-amiens.fr"
                  className="text-muted-foreground hover:text-emerald-700 transition-colors"
                >
                  contact@padel-amiens.fr
                </a>
              </li>
              <li>
                <FooterLink href="/mentions-legales">Mentions légales</FooterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne du bas */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Padel Amiens · Bêta · Projet
            communautaire indépendant
          </p>
          <p className="flex items-center gap-1">
            Pas affilié à la FFT. Inscriptions via{' '}
            <a
              href="https://tenup.fft.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Ten&apos;Up
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// Sous-composants : titre + lien + lien externe
// ============================================
function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-emerald-700 transition-colors"
    >
      {children}
    </Link>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-emerald-700 transition-colors"
    >
      {children}
    </a>
  );
}
