// ============================================
// Wrapper client pour ClubsMap — lazy load Leaflet
// ============================================
// Même pattern que club-map-client.tsx : on isole le dynamic import avec
// ssr:false pour ne pas casser le SSR de /jouer.

'use client';

import dynamic from 'next/dynamic';

import type { BookableClub } from '@/types/tournament';

interface ClubsMapClientProps {
  clubs: (BookableClub & { distance_km: number | null })[];
}

const ClubsMap = dynamic(
  () => import('./clubs-map').then((m) => m.ClubsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-xl bg-slate-100 animate-pulse" aria-hidden />
    ),
  }
);

export function ClubsMapClient(props: ClubsMapClientProps) {
  return <ClubsMap {...props} />;
}
