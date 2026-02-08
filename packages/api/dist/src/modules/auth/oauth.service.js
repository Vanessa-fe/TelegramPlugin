"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let OAuthService = class OAuthService {
    prisma;
    jwtService;
    config;
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
    }
    async handleOAuthLogin(profile) {
        const provider = client_1.OAuthProvider.GOOGLE;
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
            await this.prisma.user.update({
                where: { id: existingOAuth.userId },
                data: { lastLoginAt: new Date() },
            });
            return this.generateAuthResult(existingOAuth.user);
        }
        if (profile.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: profile.email.toLowerCase() },
            });
            if (existingUser) {
                await this.prisma.oAuthAccount.create({
                    data: {
                        userId: existingUser.id,
                        provider,
                        providerUserId: profile.providerId,
                        email: profile.email.toLowerCase(),
                    },
                });
                await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: { lastLoginAt: new Date() },
                });
                return this.generateAuthResult(existingUser);
            }
        }
        const role = 'VIEWER';
        const user = await this.prisma.user.create({
            data: {
                email: profile.email?.toLowerCase() || `${profile.providerId}@oauth.local`,
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
    async generateAuthResult(user) {
        const payload = this.buildPayload(user);
        const tokens = await this.signTokens(payload);
        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    }
    buildPayload(user) {
        return {
            sub: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
        };
    }
    async signTokens(payload) {
        const accessExpiresIn = this.getTtlSeconds('JWT_ACCESS_TTL', 900);
        const refreshExpiresIn = this.getTtlSeconds('JWT_REFRESH_TTL', 7 * 24 * 60 * 60);
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                expiresIn: accessExpiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: refreshExpiresIn,
            }),
        ]);
        return { accessToken, refreshToken };
    }
    getTtlSeconds(envKey, fallback) {
        const rawValue = this.config.get(envKey);
        if (!rawValue) {
            return fallback;
        }
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
        return fallback;
    }
};
exports.OAuthService = OAuthService;
exports.OAuthService = OAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], OAuthService);
//# sourceMappingURL=oauth.service.js.map