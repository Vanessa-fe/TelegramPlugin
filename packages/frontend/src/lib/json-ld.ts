import type { Thing, WithContext } from 'schema-dts';

export function generateOrganizationSchema(): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sublynk',
    url: 'https://sublynk.fr',
    logo: {
      '@type': 'ImageObject',
      url: 'https://sublynk.fr/android-chrome-512x512.png',
      width: '512',
      height: '512',
    },
    description:
      'Monétisez vos canaux Telegram avec des abonnements et paiements uniques. Plateforme SaaS complète pour créateurs et influenceurs.',
    foundingDate: '2024',
    sameAs: ['https://x.com/Sublynk'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: 'https://sublynk.fr/contact',
      availableLanguage: ['French', 'English'],
    },
  };
}

export function generateSoftwareApplicationSchema(): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Sublynk',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://sublynk.fr',
    description:
      'Plateforme SaaS pour monétiser vos canaux Telegram via abonnements et achats uniques. Gestion automatisée des accès, paiements sécurisés avec Stripe.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '3',
      priceValidUntil: '2026-12-31',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Gestion automatisée des accès Telegram',
      'Abonnements récurrents et paiements uniques',
      'Intégration Stripe sécurisée',
      'Dashboard créateur complet',
      'Support multilingue (FR/EN)',
    ],
    screenshot: 'https://sublynk.fr/og-image.png',
  };
}

export function generateWebSiteSchema(): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sublynk',
    url: 'https://sublynk.fr',
    description:
      'Monétisez vos canaux Telegram avec des abonnements et paiements uniques',
    inLanguage: ['fr-FR', 'en-US'],
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://sublynk.fr${item.url}`,
    })),
  };
}

export function generateFAQPageSchema(
  faqs: Array<{ question: string; answer: string }>,
): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateProductSchema({
  name,
  description,
  price,
  currency = 'EUR',
  image,
  url,
}: {
  name: string;
  description: string;
  price: number | string;
  currency?: string;
  image?: string;
  url: string;
}): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image || 'https://sublynk.fr/og-image.png',
    url: `https://sublynk.fr${url}`,
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: `https://sublynk.fr${url}`,
    },
  };
}

export function generateArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
  category,
  tags,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string };
  category?: string;
  tags?: string[];
}): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: image || 'https://sublynk.fr/og-image.png',
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url || 'https://sublynk.fr',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sublynk',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sublynk.fr/android-chrome-512x512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sublynk.fr${url}`,
    },
    ...(category && { articleSection: category }),
    ...(tags && tags.length > 0 && { keywords: tags.join(', ') }),
  };
}

export function renderJsonLd(schema: WithContext<Thing>): string {
  return JSON.stringify(schema);
}
