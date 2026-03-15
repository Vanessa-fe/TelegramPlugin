import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/favicon-16x16.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/favicon-32x32.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/apple-touch-icon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/android-chrome-192x192.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/android-chrome-512x512.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/og-image.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/logo_160.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/maintenance.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
