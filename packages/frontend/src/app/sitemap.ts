import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = [
    '/',
    '/pricing',
    '/about',
    '/contact',
    '/login',
    '/register',
    '/faq',
    '/privacy',
    '/terms',
    '/gdpr',
    '/mentions-legales',
  ];
  const locales = ['fr', 'en'];

  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `https://sublynk.fr/${locale}${path === '/' ? '' : path}`,
      lastModified,
    })),
  );
}
