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
  return [
    ...paths.map((path) => ({
      url: `https://sublynk.fr${path === '/' ? '' : path}`,
      lastModified,
    })),
    ...paths.map((path) => ({
      url: `https://sublynk.fr/en${path === '/' ? '' : path}`,
      lastModified,
    })),
  ];
}
