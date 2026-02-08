import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { OAuthService, OAuthProfile } from './oauth.service';

interface OAuthRequest extends FastifyRequest {
  user?: OAuthProfile;
  oauthError?: string;
}

@Controller('auth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: OAuthRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const successUrl = this.config.get<string>('OAUTH_SUCCESS_REDIRECT');
    const failureUrl = this.config.get<string>('OAUTH_FAILURE_REDIRECT');

    if (req.oauthError || !req.user) {
      reply.redirect(failureUrl || '/login?error=oauth_failed');
      return;
    }

    try {
      const authResult = await this.oauthService.handleOAuthLogin(req.user);
      const isProduction = process.env.NODE_ENV === 'production';
      const sameSite = isProduction ? 'none' : 'lax';

      // Set authentication cookies
      (reply as unknown as { setCookie: Function }).setCookie(
        'accessToken',
        authResult.accessToken,
        {
          httpOnly: true,
          secure: isProduction,
          sameSite,
          path: '/',
          maxAge: 15 * 60, // 15 minutes
        },
      );

      (reply as unknown as { setCookie: Function }).setCookie(
        'refreshToken',
        authResult.refreshToken,
        {
          httpOnly: true,
          secure: isProduction,
          sameSite,
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        },
      );

      reply.redirect(successUrl || '/dashboard');
    } catch {
      reply.redirect(failureUrl || '/login?error=oauth_failed');
    }
  }
}
