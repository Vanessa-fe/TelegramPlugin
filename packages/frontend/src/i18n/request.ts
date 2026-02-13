import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';
import enMessages from './messages/en.json';
import frMessages from './messages/fr.json';

const messagesByLocale: Record<Locale, Record<string, unknown>> = {
  en: enMessages as Record<string, unknown>,
  fr: frMessages as Record<string, unknown>,
};

function getLocaleMessages(locale: Locale) {
  return messagesByLocale[locale];
}

/**
 * Server-side locale detection and message loading
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Check X-NEXT-INTL-LOCALE header first (set by middleware for non-default locales)
  const headerStore = await headers();
  const headerLocale = headerStore.get('X-NEXT-INTL-LOCALE') as Locale | undefined;

  if (headerLocale && locales.includes(headerLocale)) {
    return {
      locale: headerLocale,
      messages: getLocaleMessages(headerLocale),
    };
  }

  // 2. Check requestLocale from next-intl routing
  const requested = await requestLocale;
  const requestLocaleValue =
    requested && locales.includes(requested as Locale)
      ? (requested as Locale)
      : undefined;

  if (requestLocaleValue) {
    return {
      locale: requestLocaleValue,
      messages: getLocaleMessages(requestLocaleValue),
    };
  }

  // 3. Check cookie (user preference)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;

  if (cookieLocale && locales.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: getLocaleMessages(cookieLocale),
    };
  }

  // 4. Check Accept-Language header
  const acceptLanguage = headerStore.get('accept-language');

  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2));

    for (const browserLocale of browserLocales) {
      if (locales.includes(browserLocale as Locale)) {
        return {
          locale: browserLocale as Locale,
          messages: getLocaleMessages(browserLocale as Locale),
        };
      }
    }
  }

  // 5. Fallback to default locale
  return {
    locale: defaultLocale,
    messages: getLocaleMessages(defaultLocale),
  };
});
