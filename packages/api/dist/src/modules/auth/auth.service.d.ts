import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthProfile, AuthResult } from './auth.types';
import type { RegisterDto, UpdatePasswordDto, UpdateProfileDto } from './auth.schema';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    register(data: RegisterDto): Promise<AuthResult>;
    private slugify;
    private generateOrgSlug;
    login(email: string, password: string): Promise<AuthResult>;
    private ensureOrganization;
    refresh(refreshToken: string): Promise<AuthResult>;
    profile(userId: string): Promise<AuthProfile>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<AuthResult>;
    updatePassword(userId: string, dto: UpdatePasswordDto): Promise<AuthResult>;
    private validateUser;
    private sanitizeUser;
    private buildPayload;
    private signTokens;
    private getTtlSeconds;
}
