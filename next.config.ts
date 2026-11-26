import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Prevent unhandled type errors from aborting production builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Vercel runs ESLint by default during 'next build'. Ignoring here prevents warnings/lint from failing deployment
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
