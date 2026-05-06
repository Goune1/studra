import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/events/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/api/events/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
      {
        source: '/api/events/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
};

export default nextConfig;
