/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
