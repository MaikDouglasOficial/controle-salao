/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'blob.vercel-storage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'public.blob.vercel-storage.com', pathname: '/**' },
    ],
  },
}

module.exports = nextConfig
