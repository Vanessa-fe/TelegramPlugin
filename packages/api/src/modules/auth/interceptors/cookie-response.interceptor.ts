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
        const isProduction = process.env.NODE_ENV === 'production';

        // Use Fastify's native cookie method via the 'any' type assertion
        // This is necessary because @fastify/cookie types are not properly exposed
        (reply as any).setCookie('accessToken', data.accessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          path: '/',
          maxAge: 15 * 60, // 15 minutes in seconds
        });

        (reply as any).setCookie('refreshToken', data.refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });

        // Return user data only (no tokens in JSON)
        return { user: data.user };
      }),
    );
  }
}
