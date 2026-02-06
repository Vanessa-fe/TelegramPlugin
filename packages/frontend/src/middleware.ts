import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
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

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
