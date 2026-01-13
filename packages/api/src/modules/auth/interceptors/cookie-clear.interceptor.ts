import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyReply } from 'fastify';
import { Observable, map } from 'rxjs';
import { CLEAR_AUTH_COOKIES_KEY } from '../decorators/clear-auth-cookies.decorator';

@Injectable()
export class CookieClearInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const shouldClearCookies = this.reflector.get<boolean>(
      CLEAR_AUTH_COOKIES_KEY,
      context.getHandler(),
    );

    if (!shouldClearCookies) {
      return next.handle();
    }

    const reply = context.switchToHttp().getResponse<FastifyReply>();

    return next.handle().pipe(
      map((data) => {
        // Clear cookies by setting maxAge to 0
        // Use 'any' type assertion because @fastify/cookie types are not properly exposed
        (reply as any).setCookie('accessToken', '', {
          httpOnly: true,
          path: '/',
          maxAge: 0,
        });

        (reply as any).setCookie('refreshToken', '', {
          httpOnly: true,
          path: '/',
          maxAge: 0,
        });

        return data;
      }),
    );
  }
}
