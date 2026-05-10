// ============================================
// robots.txt — généré dynamiquement par Next.js
// ============================================
// Doc : https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
//
// Stratégie :
//   - On autorise tout sauf les routes API (pas d'intérêt à les indexer)
//   - On référence le sitemap pour aider les crawlers à découvrir nos pages

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://padel-amiens.fr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
