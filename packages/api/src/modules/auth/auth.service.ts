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
import type { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthTokens,
  AuthUser,
  JwtPayload,
  AuthProfile,
  AuthResult,
} from './auth.types';
import type {
  RegisterDto,
  UpdatePasswordDto,
  UpdateProfileDto,
} from './auth.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(data: RegisterDto): Promise<AuthResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if email exists
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Auto-create organization if not provided
    let organizationId = data.organizationId;
    if (!organizationId) {
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
        },
      });
      organizationId = org.id;
    }

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
      },
    });

    const payload = this.buildPayload(user);
    const tokens = await this.signTokens(payload);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
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
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable ou désactivé');
    }

    const tokens = await this.signTokens(this.buildPayload(user));

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
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

    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(
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

  private getFrontendBaseUrl(): string | null {
    const raw =
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('NEXT_PUBLIC_SITE_URL') ??
      this.config.get<string>('CORS_ORIGIN');

    if (!raw) {
      return null;
    }

    return raw.replace(/\/+$/, '');
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
