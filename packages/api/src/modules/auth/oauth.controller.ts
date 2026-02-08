import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from './decorators/public.decorator';
import { OAuthProfile, OAuthService } from './oauth.service';
import {
  GoogleAuthGuard,
  GoogleCallbackGuard,
} from './guards/google-auth.guard';

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

  /**
   * Step 1: Start Google OAuth
   * Must return a 302 redirect to Google (handled by Passport AuthGuard)
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Passport handles redirect (302) to Google
  }

  /**
   * Step 2: Google redirects back here
   * Here we can use our custom guard to capture errors + user
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  async googleCallback(
    @Req() req: OAuthRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const successUrl =
      this.config.get<string>('OAUTH_SUCCESS_REDIRECT') ?? '/dashboard';
    const failureUrl =
      this.config.get<string>('OAUTH_FAILURE_REDIRECT') ??
      '/login?error=oauth_failed';

    // If the guard captured an OAuth error or no user was provided
    if (req.oauthError || !req.user) {
      reply.redirect(failureUrl);
      return;
    }

    try {
      const authResult = await this.oauthService.handleOAuthLogin(req.user);

      const isProduction = process.env.NODE_ENV === 'production';

      // IMPORTANT:
      // - if your frontend is on a different domain than the API, cookies must be SameSite=None; Secure
      // - in local dev, SameSite=Lax generally works
      const sameSite: 'none' | 'lax' = isProduction ? 'none' : 'lax';

      // FastifyReply has setCookie if @fastify/cookie is registered
      reply.setCookie('accessToken', authResult.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite,
        path: '/',
        maxAge: 15 * 60, // 15 minutes (seconds)
      });

      reply.setCookie('refreshToken', authResult.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite,
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days (seconds)
      });

      reply.redirect(successUrl);
    } catch {
      reply.redirect(failureUrl);
    }
  }
}
