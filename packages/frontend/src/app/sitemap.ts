import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sublynk.fr';

  // Define paths with their SEO priorities and update frequencies
  const publicPaths: SitemapEntry[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/register', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/gdpr', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/mentions-legales', priority: 0.3, changeFrequency: 'yearly' },
    // Blog & Content
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
    { path: '/ressources', priority: 0.7, changeFrequency: 'weekly' },
    // Landing Pages
    {
      path: '/solutions/abonnement-telegram-payant',
      priority: 0.9,
      changeFrequency: 'weekly',
    },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Add French (default) and English versions of each page
  publicPaths.forEach(({ path, priority, changeFrequency }) => {
    // French version (default locale)
    entries.push({
      url: `${baseUrl}${path === '/' ? '' : path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    });

    // English version
    entries.push({
      url: `${baseUrl}/en${path === '/' ? '' : path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    });
  });

  // Add blog posts dynamically
  const blogPosts = getAllPosts();
  blogPosts.forEach((post) => {
    // French version
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.7,
    });

    // English version
    entries.push({
      url: `${baseUrl}/en/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  return entries;
}
