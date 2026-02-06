import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/checkout/',
          '/en/dashboard/',
          '/en/admin/',
          '/en/checkout/',
        ],
      },
    ],
    sitemap: 'https://sublynk.fr/sitemap.xml',
  };
}
