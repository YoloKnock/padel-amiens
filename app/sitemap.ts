// ============================================
// sitemap.xml — généré dynamiquement par Next.js
// ============================================
// Doc : https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
//
// Le sitemap aide Google à découvrir nos pages et à comprendre la fraîcheur
// du contenu. Pour notre cas (peu de pages), c'est minimaliste :
//   - / (liste des tournois, change souvent)
//   - /mentions-legales (statique)
//
// Quand on ajoutera des pages /tournoi/[id], il faudra les générer ici
// depuis Supabase.

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://padel-amiens.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
