// ============================================
// Constantes globales du projet
// ============================================

// Position de référence : Amiens Padel à Cagny
// Sert de centre pour le filtre "tournois à moins de X km"
export const REFERENCE_POINT = {
  name: 'Amiens Padel (Cagny)',
  latitude: 49.864,
  longitude: 2.378,
} as const;

// Rayon par défaut pour le filtre "près de chez moi" (en km)
export const DEFAULT_RADIUS_KM = 50;

// URL de base pour le scraping Padel Magazine — ligue Hauts-de-France
export const PADEL_MAGAZINE_BASE_URL = 'https://tournois.padelmagazine.fr/ligues/hauts-de-france';

// User-Agent identifiable (politesse + traçabilité côté Padel Magazine)
// On annonce qui on est plutôt que de mentir avec un faux Chrome
export const SCRAPER_USER_AGENT =
  'PadelAmiensBot/1.0 (+https://padel-amiens.fr/about; respectful-scraping)';

// Délai entre deux requêtes lors du scraping (ms)
// Évite de surcharger le serveur source
export const SCRAPER_DELAY_MS = 1500;

// Départements considérés comme "Hauts-de-France proche"
// Ordre approximatif de distance depuis Amiens
export const HDF_DEPARTMENTS = ['80', '60', '02', '62', '59'] as const;

// Couleurs des badges par catégorie de tournoi
// Plus la catégorie est haute, plus c'est "premium"
export const CATEGORY_COLORS: Record<string, string> = {
  P25: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  P50: 'bg-teal-100 text-teal-800 border-teal-200',
  P100: 'bg-blue-100 text-blue-800 border-blue-200',
  P250: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  P500: 'bg-purple-100 text-purple-800 border-purple-200',
  P1000: 'bg-amber-100 text-amber-800 border-amber-200',
  P1500: 'bg-orange-100 text-orange-800 border-orange-200',
  P2000: 'bg-red-100 text-red-800 border-red-200',
};

// Gradients utilisés en bandeau d'en-tête sur les cards tournoi
// Donne un effet "vrai site sport" sans recourir à des images de tournoi
// (qu'on n'a pas, et qu'on n'a pas envie de fake avec des stocks Unsplash).
export const CATEGORY_GRADIENTS: Record<string, string> = {
  P25: 'from-emerald-400 to-teal-500',
  P50: 'from-teal-400 to-cyan-500',
  P100: 'from-blue-400 to-indigo-500',
  P250: 'from-indigo-400 to-violet-500',
  P500: 'from-purple-400 to-pink-500',
  P1000: 'from-amber-400 to-orange-500',
  P1500: 'from-orange-400 to-red-500',
  P2000: 'from-red-500 to-rose-600',
};
