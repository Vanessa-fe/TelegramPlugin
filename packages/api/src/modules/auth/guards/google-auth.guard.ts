import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply, FastifyRequest } from 'fastify';

interface OAuthRequest {
  oauthError?: string;
}

interface VipQueryRequest extends FastifyRequest {
  query: {
    vip?: string;
  };
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getResponse(context: ExecutionContext) {
    const response = context.switchToHttp().getResponse<FastifyReply>();
    return response.raw;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<VipQueryRequest>();
    const vipToken = request.query?.vip;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!vipToken || !callbackUrl) {
      return undefined;
    }

    const url = new URL(callbackUrl);
    url.searchParams.set('vip', vipToken);

    return {
      callbackURL: url.toString(),
    };
  }
}

@Injectable()
export class GoogleCallbackGuard extends GoogleAuthGuard {
  private readonly logger = new Logger(GoogleCallbackGuard.name);

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
      const errMessage =
        err instanceof Error ? err.message : err ? String(err) : undefined;
      const infoMessage =
        info && typeof info === 'object'
          ? (info as { message?: string; error_description?: string })
              .message ||
            (info as { error_description?: string }).error_description ||
            JSON.stringify(info)
          : info
            ? String(info)
            : undefined;
      this.logger.warn(
        {
          err: errMessage,
          info: infoMessage,
        },
        'Google OAuth failed',
      );
      return null;
    }

    return user;
  }
}
