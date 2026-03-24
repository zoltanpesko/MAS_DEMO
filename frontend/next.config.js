/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Docker deployment
  // Allow serving static HTML files from public directory
  async rewrites() {
    return [
      {
        source: '/asset-viewer.html',
        destination: '/public/asset-viewer.html',
      },
      {
        source: '/maximo-data-sync-test.html',
        destination: '/public/maximo-data-sync-test.html',
      },
    ];
  },
}

module.exports = nextConfig

// Made with Bob
