import type { Metadata } from 'next';
import { defaultLocale, locales, type Locale } from '@/i18n/config';

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
  locale,
  noIndex = false,
}: {
  canonical: string;
  title: string;
  description?: string;
  locale?: string;
  noIndex?: boolean;
}): Metadata {
  const prefixPath = (targetLocale: Locale, path: string) => {
    const suffix = path === '/' ? '' : path;
    if (targetLocale === defaultLocale) {
      return suffix || '/';
    }
    return `/${targetLocale}${suffix}`;
  };
  const activeLocale =
    locale && locales.includes(locale as Locale)
      ? (locale as Locale)
      : defaultLocale;
  const localizedCanonical = prefixPath(activeLocale, canonical);
  const languageAlternates = locales.reduce<Record<string, string>>(
    (acc, targetLocale) => {
      acc[targetLocale] = prefixPath(targetLocale, canonical);
      return acc;
    },
    {},
  );
  const openGraphLocale = activeLocale === 'en' ? 'en_US' : 'fr_FR';

  return {
    title,
    ...(description && { description }),
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    alternates: {
      canonical: localizedCanonical,
      languages: {
        ...languageAlternates,
        'x-default': prefixPath(defaultLocale, canonical),
      },
    },
    openGraph: {
      ...OG_DEFAULTS,
      locale: openGraphLocale,
      title,
      ...(description && { description }),
      url: localizedCanonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description && { description }),
      images: ['/og-image.png'],
    },
  };
}
