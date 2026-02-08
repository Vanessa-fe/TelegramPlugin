import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuthProvider, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthTokens, JwtPayload, AuthProfile, AuthResult } from './auth.types';
import type { GoogleProfile } from './strategies/google.strategy';

export type OAuthProfile = GoogleProfile;

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleOAuthLogin(profile: OAuthProfile): Promise<AuthResult> {
    const provider = OAuthProvider.GOOGLE;

    // 1. Check if OAuth account already exists
    const existingOAuth = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: profile.providerId,
        },
      },
      include: { user: true },
    });

    if (existingOAuth) {
      // Update lastLoginAt
      await this.prisma.user.update({
        where: { id: existingOAuth.userId },
        data: { lastLoginAt: new Date() },
      });

      return this.generateAuthResult(existingOAuth.user);
    }

    // 2. Check if user with same email exists
    if (profile.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email.toLowerCase() },
      });

      if (existingUser) {
        // Link OAuth account to existing user
        await this.prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider,
            providerUserId: profile.providerId,
            email: profile.email.toLowerCase(),
          },
        });

        // Update lastLoginAt
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date() },
        });

        return this.generateAuthResult(existingUser);
      }
    }

    // 3. Create new user (without password) + OAuth account
    const role: UserRole = 'VIEWER';

    const user = await this.prisma.user.create({
      data: {
        email:
          profile.email?.toLowerCase() || `${profile.providerId}@oauth.local`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role,
        lastLoginAt: new Date(),
        oauthAccounts: {
          create: {
            provider,
            providerUserId: profile.providerId,
            email: profile.email?.toLowerCase(),
          },
        },
      },
    });

    return this.generateAuthResult(user);
  }

  async generateAuthResult(user: User): Promise<AuthResult> {
    const payload = this.buildPayload(user);
    const tokens = await this.signTokens(payload);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: User): AuthProfile {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  }

  private async signTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessExpiresIn = this.getTtlSeconds('JWT_ACCESS_TTL', 900);
    const refreshExpiresIn = this.getTtlSeconds(
      'JWT_REFRESH_TTL',
      7 * 24 * 60 * 60,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private getTtlSeconds(envKey: string, fallback: number): number {
    const rawValue = this.config.get<string>(envKey);
    if (!rawValue) {
      return fallback;
    }

    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return fallback;
  }
}
