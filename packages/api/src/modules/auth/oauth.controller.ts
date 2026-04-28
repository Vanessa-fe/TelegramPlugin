import { Controller, Get, Logger, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from './decorators/public.decorator';
import { OAuthProfile, OAuthService } from './oauth.service';
import {
  GoogleAuthGuard,
  GoogleCallbackGuard,
} from './guards/google-auth.guard';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from './auth-cookie-options';

interface OAuthRequest extends FastifyRequest {
  user?: OAuthProfile;
  oauthError?: string;
}

@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

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
      if (req.oauthError) {
        this.logger.warn(`OAuth failed: ${req.oauthError}`);
      } else {
        this.logger.warn('OAuth failed: no user returned by Google strategy');
      }
      return reply.status(302).redirect(failureUrl);
    }

    try {
      const vipToken =
        typeof (req.query as Record<string, unknown> | undefined)?.vip ===
        'string'
          ? ((req.query as Record<string, unknown>).vip as string)
          : undefined;

      const authResult = await this.oauthService.handleOAuthLogin(
        req.user,
        vipToken,
      );

      // FastifyReply has setCookie if @fastify/cookie is registered
      reply.setCookie(
        'accessToken',
        authResult.accessToken,
        getAccessTokenCookieOptions(),
      );

      reply.setCookie(
        'refreshToken',
        authResult.refreshToken,
        getRefreshTokenCookieOptions(),
      );

      // Redirect SUPERADMIN to admin dashboard
      let finalRedirectUrl = successUrl;
      if (authResult.user.role === UserRole.SUPERADMIN) {
        finalRedirectUrl = '/admin';
      }

      // Add signup param for new user registrations (for GTM tracking)
      const redirectUrl = authResult.isNewUser
        ? `${finalRedirectUrl}?signup=google`
        : finalRedirectUrl;

      return reply.status(302).redirect(redirectUrl);
    } catch (error) {
      const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
      this.logger.error(`OAuth callback failed: ${message}`);
      return reply.status(302).redirect(failureUrl);
    }
  }
}
