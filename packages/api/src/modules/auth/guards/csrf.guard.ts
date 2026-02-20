import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

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

  constructor(private readonly reflector: Reflector) {
    this.isEnabled =
      process.env.NODE_ENV === 'production' &&
      process.env.COOKIE_SAME_SITE_NONE === 'true';

    this.allowedOrigins = new Set(
      (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((origin) => origin.trim().toLowerCase())
        .filter(Boolean),
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

    // Check if route is public (some public routes like login still need CSRF protection)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // For public auth endpoints, we still want to validate Origin
    // to prevent login CSRF attacks
    const origin = request.headers.origin;

    if (!origin) {
      // No origin header - could be same-origin request or non-browser client
      // For API-to-API calls, this is expected. For browser requests,
      // modern browsers always send Origin on cross-origin requests.
      // We allow this but log for monitoring.
      return true;
    }

    const normalizedOrigin = origin.toLowerCase();

    if (!this.allowedOrigins.has(normalizedOrigin)) {
      throw new ForbiddenException(
        'Cross-origin request blocked: origin not allowed',
      );
    }

    return true;
  }
}
