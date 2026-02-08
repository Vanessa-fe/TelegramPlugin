import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface OAuthRequest {
  oauthError?: string;
}

@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  handleRequest<TUser = unknown>(
    err: any,
    user: TUser | false,
    info: any,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<OAuthRequest>();

    // Passport peut mettre des infos utiles dans "info"
    const message: string =
      (err as { message?: string })?.message ||
      (info as { message?: string })?.message ||
      (info as { error_description?: string })?.error_description ||
      'Authentication failed';

    if (err || !user) {
      request.oauthError = message;
      throw new UnauthorizedException(message);
    }

    return user;
  }
}
