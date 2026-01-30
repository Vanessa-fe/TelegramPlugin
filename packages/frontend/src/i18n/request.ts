import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

/**
 * Server-side locale detection and message loading
 */
export default getRequestConfig(async () => {
  // 1. Check cookie first (user preference)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;

  if (cookieLocale && locales.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`./messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Check Accept-Language header
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');

  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2));

    for (const browserLocale of browserLocales) {
      if (locales.includes(browserLocale as Locale)) {
        return {
          locale: browserLocale as Locale,
          messages: (await import(`./messages/${browserLocale}.json`)).default,
        };
      }
    }
  }

  // 3. Fallback to default locale
  return {
    locale: defaultLocale,
    messages: (await import(`./messages/${defaultLocale}.json`)).default,
  };
});
