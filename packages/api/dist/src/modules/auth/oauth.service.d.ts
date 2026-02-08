import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResult } from './auth.types';
import type { GoogleProfile } from './strategies/google.strategy';
export type OAuthProfile = GoogleProfile;
export declare class OAuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    handleOAuthLogin(profile: OAuthProfile): Promise<AuthResult>;
    generateAuthResult(user: User): Promise<AuthResult>;
    private sanitizeUser;
    private buildPayload;
    private signTokens;
    private getTtlSeconds;
}
