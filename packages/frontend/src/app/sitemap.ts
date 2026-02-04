import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: 'https://sublynk.fr', lastModified },
    { url: 'https://sublynk.fr/pricing', lastModified },
    { url: 'https://sublynk.fr/about', lastModified },
    { url: 'https://sublynk.fr/contact', lastModified },
    { url: 'https://sublynk.fr/login', lastModified },
    { url: 'https://sublynk.fr/register', lastModified },
    { url: 'https://sublynk.fr/privacy', lastModified },
    { url: 'https://sublynk.fr/terms', lastModified },
    { url: 'https://sublynk.fr/gdpr', lastModified },
  ];
}
