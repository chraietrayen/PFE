import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {},
  
  // Enable experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self), payment=()',
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // =============================================
      // API Cache-Control headers by tier
      // =============================================

      // STATIC tier (5 min) - rarely changing data
      {
        source: '/api/roles',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/api/roles-db',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/api/user-permissions',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/api/users/preferences',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=300, stale-while-revalidate=600' }],
      },
      {
        source: '/api/documents',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=300, stale-while-revalidate=600' }],
      },

      // SEMI tier (1 min) - list data that changes occasionally
      {
        source: '/api/employees',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/employees/approved',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/employees/pending',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/rh/employees',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/rh/employees/:id',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/rh/pending',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/conges/all',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/conges/pending',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/users',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/users/:id',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/payroll/reports',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/rewards',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },

      // SHORT tier (30s) - dashboard stats, aggregated data
      {
        source: '/api/rh/dashboard',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/rh/dashboard/stats',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/rh/pending-items',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/workspace',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/payroll/dashboard',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/payroll/analytics',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/attendance/summary',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/attendance/team',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/employees/dashboard',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/pointage/stats',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/pointage/anomalies',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/pointage-simple/stats',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/logs',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },

      // PERSONAL tier (10s private) - user-specific data
      {
        source: '/api/users/me',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/employees/me',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/conges',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/conges/enhanced',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/profile/status',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/pointage/me',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/pointage-simple/recent',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/auth/login-history',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/cookies/consent',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=60, stale-while-revalidate=120' }],
      },

      // NONE tier - realtime data, no caching
      {
        source: '/api/pointage/today-status',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/api/pointage-simple/today-status',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/api/notifications',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/api/notifications/all',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/api/employees/recent-activities',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/api/health',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/api/users/check-email',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/api/debug/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
  
  // Redirects configuration
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Webpack configuration for optimizations
  webpack: (config, { isServer }) => {
    // Optimize chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Generate ETags
  generateEtags: true,
};

export default nextConfig;
