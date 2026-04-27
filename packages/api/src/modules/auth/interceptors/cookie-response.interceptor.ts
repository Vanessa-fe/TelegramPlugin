import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyReply } from 'fastify';
import { Observable, map } from 'rxjs';
import { SET_AUTH_COOKIES_KEY } from '../decorators/set-auth-cookies.decorator';
import type { AuthResult } from '../auth.types';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '../auth-cookie-options';

@Injectable()
export class CookieResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const shouldSetCookies = this.reflector.get<boolean>(
      SET_AUTH_COOKIES_KEY,
      context.getHandler(),
    );

    if (!shouldSetCookies) {
      return next.handle();
    }

    const reply = context.switchToHttp().getResponse<FastifyReply>();

    return next.handle().pipe(
      map((data: AuthResult) => {
        // Use Fastify's native cookie method via the 'any' type assertion
        // This is necessary because @fastify/cookie types are not properly exposed
        (reply as any).setCookie(
          'accessToken',
          data.accessToken,
          getAccessTokenCookieOptions(),
        );

        (reply as any).setCookie(
          'refreshToken',
          data.refreshToken,
          getRefreshTokenCookieOptions(),
        );

        // Return user data only (no tokens in JSON)
        return { user: data.user };
      }),
    );
  }
}
