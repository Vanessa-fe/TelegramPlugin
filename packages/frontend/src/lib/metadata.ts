import type { Metadata } from 'next';

const OG_DEFAULTS = {
  siteName: 'Sublynk',
  locale: 'fr_FR',
  type: 'website' as const,
  images: [
    {
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Sublynk – Monétisez vos canaux Telegram',
    },
  ],
};

export function buildMetadata({
  canonical,
  title,
  description,
}: {
  canonical: string;
  title: string;
  description?: string;
}): Metadata {
  return {
    alternates: { canonical },
    openGraph: {
      ...OG_DEFAULTS,
      title,
      ...(description && { description }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description && { description }),
      images: ['/og-image.png'],
    },
  };
}
