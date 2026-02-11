"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    config;
    notifications;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, config, notifications) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        this.notifications = notifications;
    }
    async register(data) {
        const normalizedEmail = data.email.trim().toLowerCase();
        const existing = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existing) {
            throw new common_1.ConflictException('Cet email est déjà utilisé');
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        let organizationId = data.organizationId;
        if (!organizationId) {
            const slug = await this.generateOrgSlug(normalizedEmail, data.firstName, data.lastName);
            const orgName = data.firstName && data.lastName
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
        const role = 'ORG_ADMIN';
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
    slugify(value) {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
            .slice(0, 50);
    }
    async generateOrgSlug(email, firstName, lastName) {
        const baseName = [firstName, lastName].filter(Boolean).join(' ');
        const fallback = email.split('@')[0] || 'creator';
        const base = this.slugify(baseName || fallback) || 'creator';
        let slug = base;
        let counter = 1;
        while (await this.prisma.organization.findUnique({
            where: { slug },
            select: { id: true },
        })) {
            slug = `${base}-${counter}`;
            counter += 1;
        }
        return slug;
    }
    async login(email, password) {
        let user = await this.validateUser(email, password);
        user = await this.ensureOrganization(user);
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
    async ensureOrganization(user) {
        if (user.organizationId) {
            return user;
        }
        const slug = await this.generateOrgSlug(user.email, user.firstName, user.lastName);
        const orgName = user.firstName && user.lastName
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
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Refresh token invalide');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Utilisateur introuvable ou désactivé');
        }
        const tokens = await this.signTokens(this.buildPayload(user));
        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    async profile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.ForbiddenException('Utilisateur introuvable');
        }
        return this.sanitizeUser(user);
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.ForbiddenException('Utilisateur introuvable');
        }
        const dataToUpdate = {};
        if (dto.email) {
            const normalizedEmail = dto.email.trim().toLowerCase();
            if (normalizedEmail !== user.email) {
                if (user.passwordHash) {
                    if (!dto.currentPassword) {
                        throw new common_1.UnauthorizedException('Mot de passe actuel requis');
                    }
                    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
                    if (!passwordValid) {
                        throw new common_1.UnauthorizedException('Mot de passe actuel invalide');
                    }
                }
                const existing = await this.prisma.user.findUnique({
                    where: { email: normalizedEmail },
                    select: { id: true },
                });
                if (existing && existing.id !== user.id) {
                    throw new common_1.ConflictException('Cet email est déjà utilisé');
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
    async updatePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.ForbiddenException('Utilisateur introuvable');
        }
        if (user.passwordHash) {
            if (!dto.currentPassword) {
                throw new common_1.UnauthorizedException('Mot de passe actuel requis');
            }
            const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
            if (!passwordValid) {
                throw new common_1.UnauthorizedException('Mot de passe actuel invalide');
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
    async requestPasswordReset(email) {
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
            this.logger.warn('Password reset requested but frontend URL is not configured');
            return;
        }
        const token = this.generateResetToken();
        const tokenHash = this.hashResetToken(token);
        const expiresAt = new Date(Date.now() + this.getPasswordResetTtlMinutes() * 60 * 1000);
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
        const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
        await this.notifications.sendPasswordResetEmail(user.email, resetLink, user.firstName ?? undefined);
    }
    async resetPassword(token, newPassword) {
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
            throw new common_1.BadRequestException('Token invalide ou expiré');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: resetToken.userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.ForbiddenException('Utilisateur introuvable');
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
    async validateUser(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Identifiants invalides');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Ce compte est désactivé');
        }
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Identifiants invalides');
        }
        return user;
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
    getPasswordResetTtlMinutes() {
        const rawValue = this.config.get('PASSWORD_RESET_TTL_MINUTES');
        if (!rawValue) {
            return 60;
        }
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
        return 60;
    }
    getFrontendBaseUrl() {
        const raw = this.config.get('FRONTEND_URL') ??
            this.config.get('NEXT_PUBLIC_SITE_URL') ??
            this.config.get('CORS_ORIGIN');
        if (!raw) {
            return null;
        }
        return raw.replace(/\/+$/, '');
    }
    generateResetToken() {
        return (0, node_crypto_1.randomBytes)(32).toString('base64url');
    }
    hashResetToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map