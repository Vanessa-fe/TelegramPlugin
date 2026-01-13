import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthProfile, AuthResult } from './auth.types';
import type { RegisterDto } from './auth.schema';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    register(data: RegisterDto): Promise<AuthResult>;
    login(email: string, password: string): Promise<AuthResult>;
    refresh(refreshToken: string): Promise<AuthResult>;
    profile(userId: string): Promise<AuthProfile>;
    private validateUser;
    private sanitizeUser;
    private buildPayload;
    private signTokens;
    private getTtlSeconds;
}
