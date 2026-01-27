import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthTokens,
  AuthUser,
  JwtPayload,
  AuthProfile,
  AuthResult,
} from './auth.types';
import type { RegisterDto } from './auth.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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

    // Determine role based on organizationId
    const role: UserRole = data.organizationId ? 'ORG_ADMIN' : 'VIEWER';

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: data.organizationId,
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

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.validateUser(email, password);

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
}
