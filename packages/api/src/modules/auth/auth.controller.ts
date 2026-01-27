import {
  Body,
  Controller,
  Get,
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
import type { AuthUser, AuthResult, AuthProfile } from './auth.types';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  type LoginDto,
  type RefreshDto,
  type RegisterDto,
} from './auth.schema';

@Controller('auth')
@UseInterceptors(CookieResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @SetAuthCookies()
  register(
    @Body(new ZodValidationPipe(registerSchema))
    body: RegisterDto,
  ): Promise<AuthResult> {
    return this.authService.register(body);
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
  @UseInterceptors(CookieClearInterceptor)
  @ClearAuthCookies()
  logout(): { message: string } {
    return { message: 'Déconnexion réussie' };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<AuthProfile> {
    return this.authService.profile(user.userId);
  }
}
