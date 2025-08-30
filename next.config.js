/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
