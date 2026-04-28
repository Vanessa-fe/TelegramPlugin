const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const OAUTH_VIP_TOKEN_MAX_AGE_SECONDS = 10 * 60;

function getSameSite(): 'lax' | 'none' {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowCrossSite = process.env.COOKIE_SAME_SITE_NONE === 'true';

  return isProduction && allowCrossSite ? 'none' : 'lax';
}

function getCookieDomain(): string | undefined {
  const rawDomain = process.env.COOKIE_DOMAIN?.trim();

  if (!rawDomain) {
    return undefined;
  }

  return rawDomain;
}

function createAuthCookieOptions(maxAge: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = getCookieDomain();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: getSameSite(),
    path: '/',
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

function createTransientCookieOptions(maxAge: number, path: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = getCookieDomain();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: getSameSite(),
    path,
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

export function getAccessTokenCookieOptions() {
  return createAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export function getRefreshTokenCookieOptions() {
  return createAuthCookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS);
}

export function getClearedAccessTokenCookieOptions() {
  return createAuthCookieOptions(0);
}

export function getClearedRefreshTokenCookieOptions() {
  return createAuthCookieOptions(0);
}

export function getVipOAuthTokenCookieOptions() {
  return createTransientCookieOptions(
    OAUTH_VIP_TOKEN_MAX_AGE_SECONDS,
    '/auth/google',
  );
}

export function getClearedVipOAuthTokenCookieOptions() {
  return createTransientCookieOptions(0, '/auth/google');
}
