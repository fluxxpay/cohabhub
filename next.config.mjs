/** @type {import('next').NextConfig} */
const nextConfig = {
  // For local development, basePath is '/'
  // This file will be overwritten during deployment with the appropriate basePath
  images: {},
  // Utiliser 'standalone' uniquement pour Docker/VPS, pas pour Vercel
  // Vercel gère automatiquement l'optimisation
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
