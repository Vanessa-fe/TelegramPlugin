import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply } from 'fastify';

interface OAuthRequest {
  oauthError?: string;
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getResponse(context: ExecutionContext) {
    const response = context.switchToHttp().getResponse<FastifyReply>();
    return response.raw;
  }
}

@Injectable()
export class GoogleCallbackGuard extends GoogleAuthGuard {
  handleRequest<TUser = unknown>(
    err: any,
    user: TUser | false,
    info: any,
    context: ExecutionContext,
  ): TUser | null {
    const request = context.switchToHttp().getRequest<OAuthRequest>();

    // Passport peut mettre des infos utiles dans "info"
    const message: string =
      (err as { message?: string })?.message ||
      (info as { message?: string })?.message ||
      (info as { error_description?: string })?.error_description ||
      'Authentication failed';

    if (err || !user) {
      request.oauthError = message;
      return null;
    }

    return user;
  }
}
