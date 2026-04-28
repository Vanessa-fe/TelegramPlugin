import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { CookieResponseInterceptor } from './interceptors/cookie-response.interceptor';
import { CookieClearInterceptor } from './interceptors/cookie-clear.interceptor';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformSubscriptionModule } from '../platform-subscription/platform-subscription.module';
import { VipInvitationsModule } from '../vip-invitations/vip-invitations.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    NotificationsModule,
    PlatformSubscriptionModule,
    VipInvitationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    OAuthService,
    JwtAccessStrategy,
    GoogleStrategy,
    CookieResponseInterceptor,
    CookieClearInterceptor,
  ],
  exports: [AuthService, OAuthService],
})
export class AuthModule {}
