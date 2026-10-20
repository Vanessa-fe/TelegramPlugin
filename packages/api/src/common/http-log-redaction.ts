/**
 * pino-http logs every request and response with its headers, URL and query.
 * These carry credentials that must never reach the Fly logs:
 * - session cookies (accessToken, refreshToken, vipOAuthToken) and the fresh
 *   ones issued in Set-Cookie by /auth/login and /auth/refresh
 * - Bearer tokens (JwtAccessStrategy falls back to the Authorization header)
 * - webhook credentials: stripe-signature and x-telegram-stars-secret
 * - the Google OAuth code/state on /auth/google/callback
 */
export const HTTP_LOG_REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers["stripe-signature"]',
  'req.headers["x-telegram-stars-secret"]',
  'req.query.code',
  'req.query.state',
  'res.headers["set-cookie"]',
];

export const HTTP_LOG_REDACT_CENSOR = '[Redacted]';

// A team invite token is enough to create the invited account
// (POST /team/invites/accept), and it travels in the URL path.
const SECRET_PATH_SEGMENT = /(\/team\/invites\/public\/)[^/?#]+/;
const SECRET_QUERY_PARAM = /([?&](?:code|state)=)[^&#]*/g;

export function redactUrlSecrets(url: string): string {
  return url
    .replace(SECRET_PATH_SEGMENT, `$1${HTTP_LOG_REDACT_CENSOR}`)
    .replace(SECRET_QUERY_PARAM, `$1${HTTP_LOG_REDACT_CENSOR}`);
}

/** Custom pino-http `req` serializer; receives the std-serialized request. */
export function serializeLoggedRequest<T extends { url?: unknown }>(req: T): T {
  if (typeof req.url === 'string') {
    req.url = redactUrlSecrets(req.url);
  }
  return req;
}
