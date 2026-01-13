import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
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
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
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
        role: UserRole.VIEWER,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        isActive: true,
        organizationId: null,
        passwordHash: 'hashed',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result.user.email).toBe(registerDto.email.toLowerCase());
      expect(result.accessToken).toBe('token');
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      });

      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'Test1234!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should assign ORG_ADMIN role when organizationId is provided', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test1234!',
        organizationId: 'org-123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: registerDto.email.toLowerCase(),
        role: UserRole.ORG_ADMIN,
        organizationId: 'org-123',
        isActive: true,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ORG_ADMIN,
          organizationId: 'org-123',
        }),
      });
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
        organizationId: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.user.update.mockResolvedValue({});
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
    it('should refresh tokens successfully', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        organizationId: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        isActive: true,
        role: UserRole.VIEWER,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        organizationId: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
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

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        organizationId: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

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
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        isActive: false,
        role: UserRole.VIEWER,
        passwordHash: 'hashed',
        firstName: null,
        lastName: null,
        organizationId: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
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
