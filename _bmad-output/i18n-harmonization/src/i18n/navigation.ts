import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

/**
 * Navigation utilities with locale support
 *
 * Usage:
 * import { Link, useRouter, usePathname } from '@/i18n/navigation';
 */
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  // No locale prefix in URL for cleaner URLs (locale stored in cookie)
  localePrefix: 'never',
});
