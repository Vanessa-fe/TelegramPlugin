import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const PUBLIC_FILE = /\.(.*)$/;

function isSupportedLocale(value: string | undefined): value is (typeof locales)[number] {
  return Boolean(value && locales.includes(value as (typeof locales)[number]));
}

function detectLocaleFromAcceptLanguage(acceptLanguageHeader: string | null): (typeof locales)[number] {
  if (!acceptLanguageHeader) {
    return defaultLocale;
  }

  const browserLocales = acceptLanguageHeader
    .split(',')
    .map((lang) => lang.split(';')[0].trim().substring(0, 2));

  const matchedLocale = browserLocales.find((lang) => isSupportedLocale(lang));
  return matchedLocale ?? defaultLocale;
}

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      PUBLIC_FILE.test(pathname)
    ) {
      return NextResponse.next();
    }

    const localeMatch = locales.find(
      (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    );

    if (localeMatch) {
      if (localeMatch === defaultLocale) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = pathname.replace(`/${localeMatch}`, '') || '/';
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.cookies.set('NEXT_LOCALE', defaultLocale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        });
        return redirectResponse;
      }

      const newPathname = pathname.replace(`/${localeMatch}`, '') || '/';
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('X-NEXT-INTL-LOCALE', localeMatch);

      const response = NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
      response.cookies.set('NEXT_LOCALE', localeMatch, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }

    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const resolvedLocale = isSupportedLocale(cookieLocale)
      ? cookieLocale
      : detectLocaleFromAcceptLanguage(request.headers.get('accept-language'));

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-NEXT-INTL-LOCALE', resolvedLocale);
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    if (cookieLocale !== resolvedLocale) {
      response.cookies.set('NEXT_LOCALE', resolvedLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    console.error('middleware failed, falling back to next response', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
