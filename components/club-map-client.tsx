// ============================================
// Wrapper client pour ClubMap — lazy load Leaflet
// ============================================
// Leaflet importe `window` au top-level de son bundle, ce qui casse le SSR
// même si le composant qui l'utilise est marqué 'use client'. La solution
// canonique en Next.js App Router est de passer par `next/dynamic` avec
// `ssr: false`, MAIS cette option n'est autorisée que dans un Client
// Component. D'où ce mince wrapper qui sert juste à isoler le dynamic
// import du Server Component parent (/club/[id]/page.tsx).

'use client';

import dynamic from 'next/dynamic';

interface ClubMapClientProps {
  latitude: number;
  longitude: number;
  clubName: string;
  city: string | null;
}

// `ssr: false` : on n'évalue pas le module Leaflet côté serveur. Le composant
// rend null pendant le SSR puis se charge après hydratation.
const ClubMap = dynamic(
  () => import('./club-map').then((m) => m.ClubMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 rounded-xl bg-slate-100 animate-pulse" aria-hidden />
    ),
  }
);

export function ClubMapClient(props: ClubMapClientProps) {
  return <ClubMap {...props} />;
}
