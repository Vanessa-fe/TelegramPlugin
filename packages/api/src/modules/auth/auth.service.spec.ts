import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformSubscriptionService } from '../platform-subscription/platform-subscription.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      return config[key];
    }),
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        FRONTEND_URL: 'http://localhost:3000',
        EMAIL_VERIFICATION_TTL_MINUTES: '1440',
      };
      return config[key];
    }),
  };

  const mockNotificationsService = {
    sendPasswordResetEmail: jest.fn(),
    sendEmailVerificationEmail: jest.fn(),
    sendAccountAlreadyExistsEmail: jest.fn(),
  };

  const mockPlatformSubscriptionService = {
    activateFreePlan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        {
          provide: PlatformSubscriptionService,
          useValue: mockPlatformSubscriptionService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    mockPrismaService.organization.findUnique.mockResolvedValue(null);
    mockPrismaService.organization.create.mockResolvedValue({ id: 'org-1' });
    mockPrismaService.$transaction.mockImplementation(async (callback: any) =>
      callback(mockPrismaService),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new unverified user and send a verification email', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: registerDto.email.toLowerCase(),
        role: UserRole.ORG_ADMIN,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        isActive: true,
        organizationId: 'org-1',
        passwordHash: 'hashed',
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          billingEmail: registerDto.email.toLowerCase(),
          currency: 'EUR',
        }),
      });
      expect(
        mockPrismaService.emailVerificationToken.deleteMany,
      ).toHaveBeenCalledWith({
        where: { userId: '1', usedAt: null },
      });
      expect(
        mockPrismaService.emailVerificationToken.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: '1',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
      expect(
        mockNotificationsService.sendEmailVerificationEmail,
      ).toHaveBeenCalledWith(
        registerDto.email.toLowerCase(),
        expect.stringContaining('/verify-email#token='),
        registerDto.firstName,
      );
      expect(result.verificationRequired).toBe(true);
      expect(result.email).toBe(registerDto.email.toLowerCase());
    });

    it('should use the provided currency when creating organization', async () => {
      const registerDto = {
        email: 'us-creator@example.com',
        password: 'Test1234!',
        currency: 'USD',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: registerDto.email.toLowerCase(),
        role: UserRole.ORG_ADMIN,
        organizationId: 'org-1',
        isActive: true,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.register(registerDto);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          billingEmail: registerDto.email.toLowerCase(),
          currency: 'USD',
        }),
      });
    });

    it('should send account exists email if email already registered (no enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      });

      // Should NOT throw - returns same response to prevent email enumeration
      const result = await service.register({
        email: 'existing@example.com',
        password: 'Test1234!',
      });

      expect(result.verificationRequired).toBe(true);
      expect(result.email).toBe('existing@example.com');
      expect(
        mockNotificationsService.sendAccountAlreadyExistsEmail,
      ).toHaveBeenCalledWith(
        'existing@example.com',
        expect.stringContaining('/login'),
        expect.stringContaining('/forgot-password'),
      );
    });

    it('should always create a new organization for public registration', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test1234!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.create.mockResolvedValue({
        id: 'new-org-id',
      });
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: registerDto.email.toLowerCase(),
        role: UserRole.ORG_ADMIN,
        organizationId: 'new-org-id',
        isActive: true,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.register(registerDto);

      // Verify organization was always created
      expect(mockPrismaService.organization.create).toHaveBeenCalled();
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ORG_ADMIN,
          organizationId: 'new-org-id',
          emailVerifiedAt: null,
        }),
      });
    });

    it('should store the selected plan on organization metadata during registration', async () => {
      const registerDto = {
        email: 'starter@example.com',
        password: 'Test1234!',
        platformPlanName: 'starter' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        role: UserRole.ORG_ADMIN,
        organizationId: 'org-1',
        isActive: true,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.register(registerDto);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { pendingPlatformPlan: 'starter' },
        }),
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return auth tokens', async () => {
      const now = new Date();
      mockPrismaService.emailVerificationToken.findFirst.mockResolvedValue({
        id: 'token-1',
        userId: '1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 1000 * 60),
        usedAt: null,
        createdAt: new Date(),
        user: {
          id: '1',
          email: 'test@example.com',
          role: UserRole.ORG_ADMIN,
          organizationId: 'org-1',
          passwordHash: 'hashed',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          emailVerifiedAt: null,
          lastLoginAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: UserRole.ORG_ADMIN,
        organizationId: 'org-1',
        passwordHash: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        emailVerifiedAt: now,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });
      mockPrismaService.organization.findUnique.mockResolvedValue({
        metadata: null,
      });
      mockPrismaService.emailVerificationToken.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.verifyEmail('plain-token');

      expect(
        mockPrismaService.emailVerificationToken.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.any(String),
          usedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        include: { user: true },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          emailVerifiedAt: expect.any(Date),
          lastLoginAt: expect.any(Date),
        },
      });
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('token');
    });

    it('should activate starter after email verification when selected during registration', async () => {
      const now = new Date();
      mockPrismaService.emailVerificationToken.findFirst.mockResolvedValue({
        id: 'token-1',
        userId: '1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 1000 * 60),
        usedAt: null,
        createdAt: new Date(),
        user: {
          id: '1',
          email: 'starter@example.com',
          role: UserRole.ORG_ADMIN,
          organizationId: 'org-1',
          passwordHash: 'hashed',
          firstName: 'Starter',
          lastName: 'User',
          isActive: true,
          emailVerifiedAt: null,
          lastLoginAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: '1',
        email: 'starter@example.com',
        role: UserRole.ORG_ADMIN,
        organizationId: 'org-1',
        passwordHash: 'hashed',
        firstName: 'Starter',
        lastName: 'User',
        isActive: true,
        emailVerifiedAt: now,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });
      mockPrismaService.organization.findUnique.mockResolvedValue({
        metadata: { pendingPlatformPlan: 'starter' },
      });
      mockPrismaService.organization.update.mockResolvedValue({
        id: 'org-1',
      });
      mockPrismaService.emailVerificationToken.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.verifyEmail('plain-token');

      expect(
        mockPlatformSubscriptionService.activateFreePlan,
      ).toHaveBeenCalledWith('org-1', 'starter');
      expect(mockPrismaService.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { metadata: Prisma.DbNull },
      });
      expect(result.accessToken).toBe('token');
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockPrismaService.emailVerificationToken.findFirst.mockResolvedValue(
        null,
      );

      await expect(service.verifyEmail('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully and update lastLoginAt', async () => {
      const email = 'test@example.com';
      const password = 'Test1234!';
      const hashedPassword = await bcrypt.hash(password, 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email,
        passwordHash: hashedPassword,
        isActive: true,
        role: UserRole.VIEWER,
        firstName: null,
        lastName: null,
        organizationId: 'org-1',
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: '1',
        email,
        passwordHash: hashedPassword,
        isActive: true,
        role: UserRole.VIEWER,
        firstName: null,
        lastName: null,
        organizationId: 'org-1',
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(email, password);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBe('token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        isActive: false,
        role: UserRole.VIEWER,
        firstName: null,
        lastName: null,
        organizationId: null,
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.login('test@example.com', 'Test1234!'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if email is not verified', async () => {
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        role: UserRole.VIEWER,
        firstName: null,
        lastName: null,
        organizationId: null,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.login('test@example.com', 'Test1234!'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        role: UserRole.VIEWER,
        firstName: null,
        lastName: null,
        organizationId: null,
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.login('test@example.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully with token rotation', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        organizationId: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: '1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        isActive: true,
        role: UserRole.VIEWER,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        organizationId: null,
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.refreshToken.update.mockResolvedValue({ id: 'rt-1' });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-2' });
      mockJwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token not in database', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        organizationId: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        organizationId: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: '1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: new Date(), // Token is revoked
      });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        organizationId: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: '1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        isActive: false,
        role: UserRole.VIEWER,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        organizationId: null,
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke all refresh tokens when userId is provided', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await service.logout({ userId: 'user-1' });

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should fall back to refresh token when access token cannot be used', async () => {
      mockJwtService.verifyAsync
        .mockRejectedValueOnce(new Error('expired'))
        .mockResolvedValueOnce({
          sub: 'user-2',
          email: 'user@example.com',
          role: UserRole.SUPERADMIN,
          organizationId: null,
        });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout({
        accessToken: 'expired-access-token',
        refreshToken: 'valid-refresh-token',
      });

      expect(mockJwtService.verifyAsync).toHaveBeenNthCalledWith(
        1,
        'expired-access-token',
        {
          secret: 'test-access-secret',
          ignoreExpiration: true,
        },
      );
      expect(mockJwtService.verifyAsync).toHaveBeenNthCalledWith(
        2,
        'valid-refresh-token',
        {
          secret: 'test-refresh-secret',
          ignoreExpiration: true,
        },
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-2', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should revoke the specific refresh token when no user can be resolved', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout({
        refreshToken: 'orphan-refresh-token',
      });

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.any(String),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        firstName: 'Test',
        lastName: 'User',
        organizationId: null,
        isActive: true,
        passwordHash: 'hashed',
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.profile('1');

      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('Test');
    });

    it('should throw ForbiddenException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.profile('1')).rejects.toThrow(ForbiddenException);
    });
  });
});
