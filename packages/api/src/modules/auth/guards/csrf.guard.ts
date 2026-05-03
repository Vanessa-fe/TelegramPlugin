import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

/**
 * Route patterns excluded from CSRF Origin validation.
 * These are server-to-server webhook endpoints that don't send Origin headers.
 * Authentication for these routes is handled by signature verification or secrets.
 *
 * - Stripe webhooks: authenticated via stripe-signature header
 * - Telegram Stars: authenticated via x-telegram-stars-secret header
 */
const WEBHOOK_ROUTES_EXCLUDED_FROM_CSRF = [
  '/webhooks/stripe',
  '/payments/telegram-stars/webhook',
  '/payments/telegram-stars/invoice',
  '/payments/telegram-stars/validate-pre-checkout',
];

/**
 * CSRF Guard - validates Origin header for state-changing requests
 * when cookies are configured for cross-site use (SameSite=None).
 *
 * This guard only activates when COOKIE_SAME_SITE_NONE=true, providing
 * an additional layer of protection against CSRF attacks.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;
  private readonly isEnabled: boolean;

  constructor() {
    this.isEnabled =
      process.env.NODE_ENV === 'production' &&
      process.env.COOKIE_SAME_SITE_NONE === 'true';

    this.allowedOrigins = new Set(
      (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((origin) => this.normalizeOrigin(origin))
        .filter((origin): origin is string => origin !== null),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    // Skip if cross-site cookies are not enabled
    if (!this.isEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Only validate state-changing methods
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Exclude webhook routes from Origin check.
    // These are server-to-server requests that don't include Origin headers.
    // Authentication is handled by signature/secret verification.
    const urlPath = request.url.split('?')[0];
    if (WEBHOOK_ROUTES_EXCLUDED_FROM_CSRF.includes(urlPath)) {
      return true;
    }

    const origin = request.headers.origin;

    if (!origin) {
      throw new ForbiddenException(
        'Cross-origin request blocked: missing Origin header',
      );
    }

    const normalizedOrigin = this.normalizeOrigin(origin);

    if (!normalizedOrigin) {
      throw new ForbiddenException(
        'Cross-origin request blocked: invalid Origin header',
      );
    }

    if (!this.allowedOrigins.has(normalizedOrigin)) {
      throw new ForbiddenException(
        'Cross-origin request blocked: origin not allowed',
      );
    }

    return true;
  }

  private normalizeOrigin(origin: string): string | null {
    const trimmed = origin.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }

    try {
      return new URL(trimmed).origin.toLowerCase();
    } catch {
      return null;
    }
  }
}
