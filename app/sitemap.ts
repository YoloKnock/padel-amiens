// ============================================
// sitemap.xml — généré dynamiquement par Next.js
// ============================================
// Doc : https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
//
// Stratégie :
//   - / et /mentions-legales (pages statiques)
//   - /tournoi/[id] pour chaque tournoi à venir (généré depuis Supabase)
//
// Le sitemap est revalidé toutes les heures pour rester à jour avec les
// scrapes (qui tournent toutes les 6h en prod).

import type { MetadataRoute } from 'next';

import { createAdminClient } from '@/lib/supabase';

const BASE_URL = 'https://padel-amiens.fr';

// Revalidation horaire — on n'a pas besoin d'être pile poil sur le dernier
// tournoi scrapé, et ça évite de taper Supabase à chaque requête bot
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Entrées statiques toujours présentes
  const staticEntries: MetadataRoute.Sitemap = [
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

  // Entrées dynamiques : un lien par tournoi à venir
  // On enveloppe dans un try/catch parce que le sitemap peut être généré au
  // build initial sans Supabase configurée — auquel cas on retourne juste les
  // pages statiques.
  let tournamentEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('upcoming_tournaments')
      .select('id, start_date')
      .order('start_date', { ascending: true })
      .limit(1000); // largement assez pour 6 mois de tournois en HDF

    tournamentEntries = (data ?? []).map((t) => ({
      url: `${BASE_URL}/tournoi/${t.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.warn('[sitemap] Skipped tournament entries:', error);
  }

  return [...staticEntries, ...tournamentEntries];
}
