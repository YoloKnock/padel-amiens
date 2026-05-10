/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration des images distantes (utile pour les logos de clubs plus tard)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tournois.padelmagazine.fr',
      },
      {
        protocol: 'https',
        hostname: 'padelmagazine.fr',
      },
    ],
  },
  // Permet d'utiliser cheerio dans les API routes (côté serveur)
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
};

export default nextConfig;
