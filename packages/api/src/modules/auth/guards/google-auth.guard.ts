import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface OAuthRequest {
  oauthError?: string;
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      const request = context.switchToHttp().getRequest<OAuthRequest>();
      request.oauthError = err?.message || 'Authentication failed';
      return null as TUser;
    }
    return user;
  }
}
