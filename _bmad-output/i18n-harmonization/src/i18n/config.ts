/**
 * next-intl configuration for TelegramPlugin
 *
 * Supported locales: French (default) and English
 * French is the primary language for the creator-facing dashboard
 */

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

// Locale detection settings
export const localeDetection = {
  // Use cookie to persist user preference
  cookieName: 'NEXT_LOCALE',
  // Fallback to browser language if no cookie
  lookupFromBrowser: true,
};
