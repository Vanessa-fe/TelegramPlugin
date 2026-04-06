import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import type { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthTokens,
  JwtPayload,
  AuthProfile,
  AuthResult,
  RegisterResult,
} from './auth.types';
import type {
  RegisterDto,
  UpdatePasswordDto,
  UpdateProfileDto,
} from './auth.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformSubscriptionService } from '../platform-subscription/platform-subscription.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly platformSubscriptionService: PlatformSubscriptionService,
  ) {}

  async register(
    data: RegisterDto,
    frontendOrigin?: string,
  ): Promise<RegisterResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const frontendUrl = this.resolveFrontendBaseUrl(frontendOrigin);
    if (!frontendUrl) {
      this.logger.error(
        'Email verification requested but frontend URL is not configured',
      );
      throw new BadRequestException(
        "L'inscription est temporairement indisponible",
      );
    }

    // Check if email exists - but don't reveal this to the caller
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Send a different email to inform the user they already have an account
      // This prevents email enumeration while still being helpful to legitimate users
      const loginLink = `${frontendUrl}/login`;
      const resetPasswordLink = `${frontendUrl}/forgot-password`;
      await this.notifications.sendAccountAlreadyExistsEmail(
        normalizedEmail,
        loginLink,
        resetPasswordLink,
      );

      // Return the same response as a successful registration
      // to prevent email enumeration attacks
      return {
        message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
        email: normalizedEmail,
        verificationRequired: true,
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Always create a new organization for public registration
    // This prevents privilege escalation by specifying an existing organizationId
    const organizationCurrency = data.currency ?? 'EUR';
    const slug = await this.generateOrgSlug(
      normalizedEmail,
      data.firstName,
      data.lastName,
    );
    const orgName =
      data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : normalizedEmail.split('@')[0];

    const org = await this.prisma.organization.create({
      data: {
        name: orgName,
        slug,
        billingEmail: normalizedEmail,
        currency: organizationCurrency,
        metadata: data.platformPlanName
          ? { pendingPlatformPlan: data.platformPlanName }
          : undefined,
      },
    });
    const organizationId = org.id;

    // All users with organizations are ORG_ADMIN
    const role: UserRole = 'ORG_ADMIN';

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId,
        role,
        emailVerifiedAt: null,
      },
    });

    await this.sendEmailVerification(user, frontendUrl);

    return {
      message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
      email: user.email,
      verificationRequired: true,
    };
  }

  async verifyEmail(token: string): Promise<AuthResult> {
    const tokenHash = this.hashVerificationToken(token);
    const now = new Date();

    const verificationToken =
      await this.prisma.emailVerificationToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: now },
        },
        include: {
          user: true,
        },
      });

    if (!verificationToken) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    if (!verificationToken.user.isActive) {
      throw new ForbiddenException('Ce compte est désactivé');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const verifiedUser = await tx.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerifiedAt: now,
          lastLoginAt: now,
        },
      });

      await tx.emailVerificationToken.updateMany({
        where: { userId: verificationToken.userId, usedAt: null },
        data: { usedAt: now },
      });

      return verifiedUser;
    });

    await this.activatePendingFreePlan(updatedUser.organizationId);

    const payload = this.buildPayload(updatedUser);
    const tokens = await this.signTokens(payload);

    return {
      ...tokens,
      user: this.sanitizeUser(updatedUser),
    };
  }

  async resendEmailVerification(
    email: string,
    frontendOrigin?: string,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive || user.emailVerifiedAt) {
      return;
    }

    const frontendUrl = this.resolveFrontendBaseUrl(frontendOrigin);
    if (!frontendUrl) {
      this.logger.warn(
        'Email verification resend requested but frontend URL is not configured',
      );
      return;
    }

    await this.sendEmailVerification(user, frontendUrl);
  }

  private async sendEmailVerification(
    user: Pick<User, 'id' | 'email' | 'firstName'>,
    frontendUrl: string,
  ): Promise<void> {
    const token = await this.issueEmailVerificationToken(user.id);
    const verificationLink = `${frontendUrl}/verify-email#token=${encodeURIComponent(
      token,
    )}`;

    await this.notifications.sendEmailVerificationEmail(
      user.email,
      verificationLink,
      user.firstName ?? undefined,
    );
  }

  private async activatePendingFreePlan(
    organizationId?: string | null,
  ): Promise<void> {
    if (!organizationId) {
      return;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { metadata: true },
    });

    const metadata =
      organization?.metadata && typeof organization.metadata === 'object'
        ? (organization.metadata as Record<string, unknown>)
        : null;

    if (metadata?.pendingPlatformPlan !== 'starter') {
      return;
    }

    try {
      await this.platformSubscriptionService.activateFreePlan(
        organizationId,
        metadata.pendingPlatformPlan,
      );

      const { pendingPlatformPlan, ...nextMetadata } =
        metadata as Prisma.InputJsonObject & {
          pendingPlatformPlan?: string;
        };
      void pendingPlatformPlan;
      const metadataUpdate =
        Object.keys(nextMetadata).length > 0 ? nextMetadata : Prisma.DbNull;

      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          metadata: metadataUpdate,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to activate pending free plan for organization ${organizationId}: ${(error as Error).message}`,
      );
    }
  }

  private async issueEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateResetToken();
    const tokenHash = this.hashVerificationToken(token);
    const expiresAt = new Date(
      Date.now() + this.getEmailVerificationTtlMinutes() * 60 * 1000,
    );

    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId, usedAt: null },
    });

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  private hashVerificationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getEmailVerificationTtlMinutes(): number {
    const rawValue = this.config.get<string>('EMAIL_VERIFICATION_TTL_MINUTES');
    if (!rawValue) {
      return 24 * 60;
    }

    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return 24 * 60;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 50);
  }

  private async generateOrgSlug(
    email: string,
    firstName?: string | null,
    lastName?: string | null,
  ): Promise<string> {
    const baseName = [firstName, lastName].filter(Boolean).join(' ');
    const fallback = email.split('@')[0] || 'creator';
    const base = this.slugify(baseName || fallback) || 'creator';
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

  async login(email: string, password: string): Promise<AuthResult> {
    let user = await this.validateUser(email, password);

    // Ensure user has an organization
    user = await this.ensureOrganization(user);

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = this.buildPayload(user);
    const tokens = await this.signTokens(payload);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  private async ensureOrganization(user: User): Promise<User> {
    if (user.organizationId) {
      return user;
    }

    const slug = await this.generateOrgSlug(
      user.email,
      user.firstName,
      user.lastName,
    );
    const orgName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email.split('@')[0];

    const org = await this.prisma.organization.create({
      data: {
        name: orgName,
        slug,
        billingEmail: user.email,
        currency: 'EUR',
      },
    });

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        role: 'ORG_ADMIN',
      },
    });
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Verify the refresh token exists in database and is not revoked
    const tokenHash = this.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt) {
      // Token reuse detected or token was revoked - revoke all user tokens for security
      if (storedToken?.revokedAt) {
        this.logger.warn(
          `Refresh token reuse detected for user ${payload.sub}. Revoking all tokens.`,
        );
        await this.revokeAllUserRefreshTokens(payload.sub);
      }
      throw new UnauthorizedException('Refresh token invalide ou révoqué');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable ou désactivé');
    }

    // Rotate: revoke old token and issue new one
    const tokens = await this.prisma.$transaction(async (tx) => {
      // Revoke the old token
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Sign new tokens
      return this.signTokens(this.buildPayload(user), tx);
    });

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async logout(params: {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<void> {
    const userId =
      params.userId ??
      (await this.resolveUserIdForLogout(
        params.accessToken,
        params.refreshToken,
      ));

    if (userId) {
      await this.revokeAllUserRefreshTokens(userId);
      return;
    }

    if (params.refreshToken) {
      await this.revokeRefreshToken(params.refreshToken);
    }
  }

  private async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async resolveUserIdForLogout(
    accessToken?: string,
    refreshToken?: string,
  ): Promise<string | null> {
    const accessTokenUserId = await this.extractUserIdFromToken(
      accessToken,
      'JWT_ACCESS_SECRET',
    );

    if (accessTokenUserId) {
      return accessTokenUserId;
    }

    return this.extractUserIdFromToken(refreshToken, 'JWT_REFRESH_SECRET');
  }

  private async extractUserIdFromToken(
    token: string | undefined,
    secretEnvKey: string,
  ): Promise<string | null> {
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>(secretEnvKey),
        ignoreExpiration: true,
      });
      return payload.sub;
    } catch {
      return null;
    }
  }

  private async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async profile(userId: string): Promise<AuthProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Utilisateur introuvable');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new ForbiddenException('Utilisateur introuvable');
    }

    const dataToUpdate: {
      email?: string;
      firstName?: string | null;
      lastName?: string | null;
    } = {};

    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        if (user.passwordHash) {
          if (!dto.currentPassword) {
            throw new UnauthorizedException('Mot de passe actuel requis');
          }
          const passwordValid = await bcrypt.compare(
            dto.currentPassword,
            user.passwordHash,
          );
          if (!passwordValid) {
            throw new UnauthorizedException('Mot de passe actuel invalide');
          }
        }

        const existing = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (existing && existing.id !== user.id) {
          throw new ConflictException('Cet email est déjà utilisé');
        }
        dataToUpdate.email = normalizedEmail;
      }
    }

    if (dto.firstName !== undefined) {
      const trimmed = dto.firstName.trim();
      dataToUpdate.firstName = trimmed ? trimmed : null;
    }

    if (dto.lastName !== undefined) {
      const trimmed = dto.lastName.trim();
      dataToUpdate.lastName = trimmed ? trimmed : null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    const tokens = await this.signTokens(this.buildPayload(updatedUser));

    return {
      ...tokens,
      user: this.sanitizeUser(updatedUser),
    };
  }

  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new ForbiddenException('Utilisateur introuvable');
    }

    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new UnauthorizedException('Mot de passe actuel requis');
      }
      const passwordValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!passwordValid) {
        throw new UnauthorizedException('Mot de passe actuel invalide');
      }
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Revoke all existing refresh tokens for security
    // (invalidates all other sessions after password change)
    await this.revokeAllUserRefreshTokens(userId);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    const tokens = await this.signTokens(this.buildPayload(updatedUser));

    return {
      ...tokens,
      user: this.sanitizeUser(updatedUser),
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      return;
    }

    const frontendUrl = this.getFrontendBaseUrl();
    if (!frontendUrl) {
      this.logger.warn(
        'Password reset requested but frontend URL is not configured',
      );
      return;
    }

    const token = this.generateResetToken();
    const tokenHash = this.hashResetToken(token);
    const expiresAt = new Date(
      Date.now() + this.getPasswordResetTtlMinutes() * 60 * 1000,
    );

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetLink = `${frontendUrl}/reset-password#token=${encodeURIComponent(
      token,
    )}`;

    await this.notifications.sendPasswordResetEmail(
      user.email,
      resetLink,
      user.firstName ?? undefined,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    const tokenHash = this.hashResetToken(token);
    const now = new Date();

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user || !user.isActive) {
      throw new ForbiddenException('Utilisateur introuvable');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Revoke all existing refresh tokens for security
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now },
      });

      const updated = await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      });

      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });

      return updated;
    });

    const tokens = await this.signTokens(this.buildPayload(updatedUser));

    return {
      ...tokens,
      user: this.sanitizeUser(updatedUser),
    };
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Ce compte est désactivé');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Veuillez vérifier votre adresse email avant de vous connecter',
      );
    }

    return user;
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

  private async signTokens(
    payload: JwtPayload,
    tx?: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
  ): Promise<AuthTokens> {
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
        jwtid: randomUUID(),
      }),
    ]);

    // Store refresh token hash in database for revocation support
    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    const prismaClient = tx ?? this.prisma;
    await prismaClient.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash,
        expiresAt,
      },
    });

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

  private getPasswordResetTtlMinutes(): number {
    const rawValue = this.config.get<string>('PASSWORD_RESET_TTL_MINUTES');
    if (!rawValue) {
      return 60;
    }

    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return 60;
  }

  private resolveFrontendBaseUrl(frontendOrigin?: string): string | null {
    const preferredOrigin = this.normalizeFrontendUrl(frontendOrigin);
    if (preferredOrigin) {
      const allowedOrigins = this.getAllowedFrontendOrigins();
      if (allowedOrigins.size === 0 || allowedOrigins.has(preferredOrigin)) {
        return preferredOrigin;
      }
    }

    return this.getFrontendBaseUrl();
  }

  private getAllowedFrontendOrigins(): Set<string> {
    const origins = new Set<string>();
    const rawValues = [
      this.config.get<string>('FRONTEND_URL'),
      this.config.get<string>('NEXT_PUBLIC_SITE_URL'),
      this.config.get<string>('CORS_ORIGIN'),
    ];

    rawValues.forEach((rawValue) => {
      if (!rawValue) {
        return;
      }

      rawValue.split(',').forEach((entry) => {
        const normalized = this.normalizeFrontendUrl(entry);
        if (normalized) {
          origins.add(normalized);
        }
      });
    });

    return origins;
  }

  private getFrontendBaseUrl(): string | null {
    const rawValues = [
      this.config.get<string>('FRONTEND_URL'),
      this.config.get<string>('NEXT_PUBLIC_SITE_URL'),
      this.config.get<string>('CORS_ORIGIN'),
    ];

    for (const rawValue of rawValues) {
      if (!rawValue) {
        continue;
      }

      const candidates = rawValue
        .split(',')
        .map((entry) => this.normalizeFrontendUrl(entry))
        .filter((entry): entry is string => Boolean(entry));

      if (candidates.length > 0) {
        return candidates[0];
      }
    }

    return null;
  }

  private normalizeFrontendUrl(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      return parsed.origin;
    } catch {
      return null;
    }
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
