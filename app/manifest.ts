// ============================================
// PWA manifest — généré dynamiquement par Next.js
// ============================================
// Sert /manifest.webmanifest et permet à l'utilisateur d'installer le site
// comme une app sur son téléphone (Safari "Ajouter à l'écran d'accueil"
// ou prompt natif Chrome/Edge). Pas de service worker pour l'instant :
// on n'a pas besoin d'offline.
//
// Doc : https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Padel Amiens',
    short_name: 'Padel Amiens',
    description:
      'Tournois homologués FFT, Americano et réservation de créneaux padel autour d\'Amiens.',
    start_url: '/',
    display: 'standalone', // mode app, sans barre d'URL
    background_color: '#ffffff',
    theme_color: '#059669', // emerald-600, cohérent avec les CTAs
    orientation: 'portrait',
    lang: 'fr-FR',
    categories: ['sports', 'lifestyle'],
    // Icônes : on utilise l'emoji 🎾 généré dynamiquement (cf. icon.tsx)
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
