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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    config;
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
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
        const role = data.organizationId ? 'ORG_ADMIN' : 'VIEWER';
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
    async login(email, password) {
        const user = await this.validateUser(email, password);
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map