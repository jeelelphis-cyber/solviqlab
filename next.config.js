/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ]
  },
  eslint: {
    // Instrument source files (seo.ts, interpret.ts) are excluded from tsconfig
    // but ESLint still picks them up — ignore during builds
    ignoreDuringBuilds: true,
  },
  // Platform instruments are built with ISR — no full static export
  // Each instrument page revalidates on-demand via revalidateTag(slug)
  experimental: {
    // typedRoutes: true, // disabled until all routes are registered
  },
  // Strict mode catches lifecycle issues early
  reactStrictMode: true,
  webpack(config) {
    // Allow .js imports to resolve .ts/.tsx files (TypeScript ESM convention)
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

module.exports = nextConfig
