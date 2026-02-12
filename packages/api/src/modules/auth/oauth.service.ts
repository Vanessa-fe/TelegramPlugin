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
      const updatedUser = await this.prisma.user.update({
        where: { id: existingOAuth.userId },
        data: { lastLoginAt: new Date() },
      });

      const ensuredUser = await this.ensureOrganization(updatedUser, profile);
      return this.generateAuthResult(ensuredUser);
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
        const updatedUser = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date() },
        });

        const ensuredUser = await this.ensureOrganization(
          updatedUser,
          profile,
        );
        return this.generateAuthResult(ensuredUser);
      }
    }

    // 3. Create new user (without password) + OAuth account + organization
    const email =
      profile.email?.toLowerCase() || `${profile.providerId}@oauth.local`;
    const organizationName = this.buildOrganizationName(profile, email);
    const organizationSlug = await this.generateUniqueOrganizationSlug(
      organizationName,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: UserRole.ORG_ADMIN,
        lastLoginAt: new Date(),
        organization: {
          create: {
            name: organizationName,
            slug: organizationSlug,
            billingEmail: email,
            currency: 'EUR',
          },
        },
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

  private buildOrganizationName(profile: OAuthProfile, email: string): string {
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    if (name) {
      return name;
    }
    return email.split('@')[0] || 'Organisation';
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 50);
  }

  private async generateUniqueOrganizationSlug(name: string): Promise<string> {
    const base = this.slugify(name) || 'organisation';
    let slug = base;
    let counter = 1;

    while (
      await this.prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private async ensureOrganization(
    user: User,
    profile: OAuthProfile,
  ): Promise<User> {
    if (user.organizationId) {
      return user;
    }

    const email = user.email;
    const organizationName = this.buildOrganizationName(profile, email);
    const organizationSlug = await this.generateUniqueOrganizationSlug(
      organizationName,
    );

    const organization = await this.prisma.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
        billingEmail: email,
        currency: 'EUR',
      },
    });

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        role: UserRole.ORG_ADMIN,
      },
    });
  }
}
