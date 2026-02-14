import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from '../../common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { SetAuthCookies } from './decorators/set-auth-cookies.decorator';
import { ClearAuthCookies } from './decorators/clear-auth-cookies.decorator';
import { CookieResponseInterceptor } from './interceptors/cookie-response.interceptor';
import { CookieClearInterceptor } from './interceptors/cookie-clear.interceptor';
import type {
  AuthUser,
  AuthResult,
  AuthProfile,
  RegisterResult,
} from './auth.types';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
  type LoginDto,
  type RefreshDto,
  type RegisterDto,
  type VerifyEmailDto,
  type ResendVerificationDto,
  type ForgotPasswordDto,
  type ResetPasswordDto,
  type UpdatePasswordDto,
  type UpdateProfileDto,
} from './auth.schema';

@Controller('auth')
@UseInterceptors(CookieResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Req() req: FastifyRequest,
    @Body(new ZodValidationPipe(registerSchema))
    body: RegisterDto,
  ): Promise<RegisterResult> {
    return this.authService.register(body, this.extractFrontendOrigin(req));
  }

  @Public()
  @Post('verify-email')
  @SetAuthCookies()
  verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema))
    body: VerifyEmailDto,
  ): Promise<AuthResult> {
    return this.authService.verifyEmail(body.token);
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(
    @Req() req: FastifyRequest,
    @Body(new ZodValidationPipe(resendVerificationSchema))
    body: ResendVerificationDto,
  ): Promise<{ message: string }> {
    await this.authService.resendEmailVerification(
      body.email,
      this.extractFrontendOrigin(req),
    );
    return {
      message:
        "Si un compte existe avec cet email et n'est pas vérifié, un email de vérification a été envoyé.",
    };
  }

  @Public()
  @Post('login')
  @SetAuthCookies()
  login(
    @Body(new ZodValidationPipe(loginSchema))
    body: LoginDto,
  ): Promise<AuthResult> {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  @SetAuthCookies()
  refresh(
    @Body(new ZodValidationPipe(refreshSchema))
    body: RefreshDto,
    @Req() req: FastifyRequest,
  ): Promise<AuthResult> {
    const refreshTokenFromCookie = (
      req as { cookies?: { refreshToken?: string } }
    ).cookies?.refreshToken;
    const refreshToken = body.refreshToken || refreshTokenFromCookie;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @Public()
  @UseInterceptors(CookieClearInterceptor)
  @ClearAuthCookies()
  logout(): { message: string } {
    return { message: 'Déconnexion réussie' };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema))
    body: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(body.email);
    return {
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    };
  }

  @Public()
  @Post('reset-password')
  @SetAuthCookies()
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema))
    body: ResetPasswordDto,
  ): Promise<AuthResult> {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<AuthProfile> {
    return this.authService.profile(user.userId);
  }

  @Patch('me')
  @SetAuthCookies()
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema))
    body: UpdateProfileDto,
  ): Promise<AuthResult> {
    return this.authService.updateProfile(user.userId, body);
  }

  @Patch('password')
  @SetAuthCookies()
  updatePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updatePasswordSchema))
    body: UpdatePasswordDto,
  ): Promise<AuthResult> {
    return this.authService.updatePassword(user.userId, body);
  }

  private extractFrontendOrigin(req: FastifyRequest): string | undefined {
    const originHeader = req.headers.origin;
    if (typeof originHeader === 'string' && originHeader.trim().length > 0) {
      return originHeader;
    }

    const refererHeader = req.headers.referer;
    if (typeof refererHeader === 'string' && refererHeader.trim().length > 0) {
      return refererHeader;
    }

    return undefined;
  }
}
