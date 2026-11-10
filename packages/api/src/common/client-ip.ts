import { isIP } from 'node:net';

type RequestLike = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

function headerIp(
  headers: RequestLike['headers'],
  name: string,
): string | undefined {
  const raw = headers[name];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value && isIP(value) ? value : undefined;
}

/**
 * Address of whoever opened the connection to Fly's edge.
 *
 * On Fly the TCP peer (`request.ip`) is always Fly's proxy, so every visitor
 * looks the same. Fly's edge writes the real peer into `Fly-Client-IP`, and
 * clients cannot reach the app without going through that edge, so the value
 * cannot be forged. For traffic proxied by Netlify (sublynk.fr/api/*) this is
 * a Netlify server, not the visitor. Off Fly (local dev) we fall back to the
 * TCP peer.
 */
export function getEdgeClientIp(req: RequestLike): string {
  return headerIp(req.headers, 'fly-client-ip') ?? req.ip ?? 'unknown';
}

/**
 * Address of the visitor, as reported by Netlify when it proxied the request.
 *
 * Anyone calling the API directly can send this header with any value, so it
 * must only ever add restrictions (an extra rate-limit bucket), never replace
 * the edge address.
 */
export function getProxiedVisitorIp(req: RequestLike): string | undefined {
  return headerIp(req.headers, 'x-nf-client-connection-ip');
}

/**
 * Rate-limit buckets a request counts against. The edge address always
 * applies (unforgeable); the Netlify visitor address is added when present so
 * one visitor cannot spread requests across Netlify's many outgoing servers.
 */
export function getRateLimitTrackers(req: RequestLike): string[] {
  const trackers = [`edge:${getEdgeClientIp(req)}`];
  const visitor = getProxiedVisitorIp(req);
  if (visitor) {
    trackers.push(`visitor:${visitor}`);
  }
  return trackers;
}
