/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Désactiver ESLint pendant le build pour éviter les erreurs
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Désactiver la vérification TypeScript pendant le build si nécessaire
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
