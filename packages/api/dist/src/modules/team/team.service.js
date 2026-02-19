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
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let TeamService = class TeamService {
    prisma;
    config;
    notifications;
    constructor(prisma, config, notifications) {
        this.prisma = prisma;
        this.config = config;
        this.notifications = notifications;
    }
    async listMembers(organizationId) {
        return this.prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
            orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
        });
    }
    async listPendingInvites(organizationId) {
        return this.prisma.teamInvite.findMany({
            where: {
                organizationId,
                acceptedAt: null,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
                invitedBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createInvite(organizationId, invitedByUserId, dto) {
        const email = dto.email.trim().toLowerCase();
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true },
        });
        if (!organization) {
            throw new common_1.BadRequestException('Organisation introuvable');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                organizationId: true,
                isActive: true,
            },
        });
        if (existingUser &&
            existingUser.organizationId === organizationId &&
            existingUser.isActive) {
            throw new common_1.BadRequestException('Cet utilisateur est déjà membre actif');
        }
        if (existingUser?.organizationId &&
            existingUser.organizationId !== organizationId) {
            throw new common_1.BadRequestException('Cet email est déjà rattaché à une autre organisation');
        }
        const existingInvite = await this.prisma.teamInvite.findFirst({
            where: {
                organizationId,
                email,
                acceptedAt: null,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            select: { id: true },
        });
        if (existingInvite) {
            throw new common_1.BadRequestException('Une invitation active existe déjà pour cet email');
        }
        const token = (0, node_crypto_1.randomBytes)(24).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invite = await this.prisma.teamInvite.create({
            data: {
                organizationId,
                email,
                role: dto.role,
                tokenHash,
                invitedByUserId,
                expiresAt,
            },
            select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
            },
        });
        const inviteUrl = `${this.getFrontendBaseUrl()}/invite/${token}`;
        await this.notifications.sendTeamInviteEmail(email, organization.name, inviteUrl, dto.role);
        return {
            ...invite,
            inviteUrl,
        };
    }
    async revokeInvite(organizationId, inviteId) {
        const invite = await this.prisma.teamInvite.findUnique({
            where: { id: inviteId },
            select: {
                id: true,
                organizationId: true,
                acceptedAt: true,
                revokedAt: true,
            },
        });
        if (!invite || invite.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Invitation introuvable');
        }
        if (invite.acceptedAt) {
            throw new common_1.BadRequestException('Cette invitation a déjà été acceptée');
        }
        if (invite.revokedAt) {
            return { success: true };
        }
        await this.prisma.teamInvite.update({
            where: { id: inviteId },
            data: { revokedAt: new Date() },
        });
        return { success: true };
    }
    async updateMemberRole(organizationId, memberId, actorUserId, dto) {
        const member = await this.prisma.user.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                organizationId: true,
            },
        });
        if (!member || member.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Membre introuvable');
        }
        if (member.role === client_1.UserRole.SUPERADMIN) {
            throw new common_1.BadRequestException('Le rôle SUPERADMIN ne peut pas être modifié ici');
        }
        if (member.role === dto.role) {
            return member;
        }
        if (member.role === client_1.UserRole.ORG_ADMIN && dto.role !== client_1.UserRole.ORG_ADMIN) {
            await this.ensureAtLeastOneActiveAdmin(organizationId, member.id);
        }
        const updated = await this.prisma.user.update({
            where: { id: memberId },
            data: { role: dto.role },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
        if (member.id === actorUserId && member.role === client_1.UserRole.ORG_ADMIN) {
            await this.ensureAtLeastOneActiveAdmin(organizationId);
        }
        return updated;
    }
    async deactivateMember(organizationId, memberId, actorUserId) {
        const member = await this.prisma.user.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                organizationId: true,
            },
        });
        if (!member || member.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Membre introuvable');
        }
        if (member.id === actorUserId) {
            throw new common_1.BadRequestException('Vous ne pouvez pas désactiver votre propre compte');
        }
        if (member.role === client_1.UserRole.SUPERADMIN) {
            throw new common_1.BadRequestException('Le compte SUPERADMIN ne peut pas être désactivé ici');
        }
        if (member.role === client_1.UserRole.ORG_ADMIN && member.isActive) {
            await this.ensureAtLeastOneActiveAdmin(organizationId, member.id);
        }
        const updated = await this.prisma.user.update({
            where: { id: memberId },
            data: { isActive: false },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
        return updated;
    }
    async reactivateMember(organizationId, memberId) {
        const member = await this.prisma.user.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                organizationId: true,
            },
        });
        if (!member || member.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Membre introuvable');
        }
        if (member.isActive) {
            return member;
        }
        if (member.role === client_1.UserRole.SUPERADMIN) {
            throw new common_1.BadRequestException('Le compte SUPERADMIN ne peut pas être réactivé ici');
        }
        return this.prisma.user.update({
            where: { id: memberId },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
    }
    async removeMember(organizationId, memberId, actorUserId) {
        const member = await this.prisma.user.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                organizationId: true,
            },
        });
        if (!member || member.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Membre introuvable');
        }
        if (member.id === actorUserId) {
            throw new common_1.BadRequestException('Vous ne pouvez pas supprimer votre propre compte de l’organisation');
        }
        if (member.role === client_1.UserRole.SUPERADMIN) {
            throw new common_1.BadRequestException('Le compte SUPERADMIN ne peut pas être supprimé ici');
        }
        if (member.role === client_1.UserRole.ORG_ADMIN && member.isActive) {
            await this.ensureAtLeastOneActiveAdmin(organizationId, member.id);
        }
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: member.id },
                data: {
                    organizationId: null,
                    role: client_1.UserRole.VIEWER,
                    isActive: false,
                },
            });
            await tx.teamInvite.updateMany({
                where: {
                    organizationId,
                    email: member.email,
                    acceptedAt: null,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                data: {
                    revokedAt: now,
                },
            });
        });
        return { success: true };
    }
    async getPublicInvite(token) {
        const invite = await this.prisma.teamInvite.findUnique({
            where: { tokenHash: this.hashToken(token) },
            select: {
                email: true,
                role: true,
                expiresAt: true,
                acceptedAt: true,
                revokedAt: true,
                organization: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!invite) {
            return {
                valid: false,
                reason: 'invalid',
                message: 'Invitation invalide',
            };
        }
        if (invite.revokedAt) {
            return {
                valid: false,
                reason: 'revoked',
                message: 'Cette invitation a été révoquée',
            };
        }
        if (invite.acceptedAt) {
            return {
                valid: false,
                reason: 'accepted',
                message: 'Cette invitation a déjà été acceptée',
            };
        }
        if (invite.expiresAt <= new Date()) {
            return {
                valid: false,
                reason: 'expired',
                message: 'Cette invitation a expiré',
            };
        }
        return {
            valid: true,
            organizationName: invite.organization.name,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expiresAt,
        };
    }
    async acceptInvite(dto) {
        const tokenHash = this.hashToken(dto.token);
        return this.prisma.$transaction(async (tx) => {
            const invite = await tx.teamInvite.findUnique({
                where: { tokenHash },
                select: {
                    id: true,
                    organizationId: true,
                    email: true,
                    role: true,
                    expiresAt: true,
                    acceptedAt: true,
                    revokedAt: true,
                    organization: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            if (!invite) {
                throw new common_1.BadRequestException('Invitation invalide');
            }
            if (invite.revokedAt) {
                throw new common_1.BadRequestException('Cette invitation a été révoquée');
            }
            if (invite.acceptedAt) {
                throw new common_1.BadRequestException('Cette invitation a déjà été acceptée');
            }
            if (invite.expiresAt <= new Date()) {
                throw new common_1.BadRequestException('Cette invitation a expiré');
            }
            const existingUser = await tx.user.findUnique({
                where: { email: invite.email },
                select: {
                    id: true,
                    organizationId: true,
                    passwordHash: true,
                    emailVerifiedAt: true,
                    firstName: true,
                    lastName: true,
                },
            });
            const firstName = this.cleanOptionalValue(dto.firstName);
            const lastName = this.cleanOptionalValue(dto.lastName);
            const password = dto.password?.trim();
            if (existingUser?.organizationId &&
                existingUser.organizationId !== invite.organizationId) {
                throw new common_1.ConflictException('Ce compte est déjà rattaché à une autre organisation');
            }
            if (!existingUser && !password) {
                throw new common_1.BadRequestException('Un mot de passe est requis pour créer votre compte');
            }
            if (existingUser) {
                const updatePayload = {
                    role: invite.role,
                    isActive: true,
                };
                if (!existingUser.emailVerifiedAt) {
                    updatePayload.emailVerifiedAt = new Date();
                }
                if (!existingUser.organizationId) {
                    updatePayload.organization = {
                        connect: { id: invite.organizationId },
                    };
                }
                if (firstName) {
                    updatePayload.firstName = firstName;
                }
                if (lastName) {
                    updatePayload.lastName = lastName;
                }
                if (!existingUser.passwordHash) {
                    if (!password) {
                        throw new common_1.BadRequestException('Un mot de passe est requis pour activer votre compte');
                    }
                    updatePayload.passwordHash = await bcrypt.hash(password, 10);
                }
                await tx.user.update({
                    where: { id: existingUser.id },
                    data: updatePayload,
                });
            }
            else {
                const passwordHash = await bcrypt.hash(password, 10);
                await tx.user.create({
                    data: {
                        email: invite.email,
                        passwordHash,
                        firstName,
                        lastName,
                        role: invite.role,
                        organizationId: invite.organizationId,
                        isActive: true,
                        emailVerifiedAt: new Date(),
                    },
                });
            }
            await tx.teamInvite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() },
            });
            return {
                success: true,
                organizationName: invite.organization.name,
                email: invite.email,
            };
        });
    }
    hashToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    getFrontendBaseUrl() {
        return (this.config.get('FRONTEND_URL') ||
            this.config.get('NEXT_PUBLIC_APP_URL') ||
            'http://localhost:3000').replace(/\/$/, '');
    }
    cleanOptionalValue(value) {
        if (!value) {
            return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    async ensureAtLeastOneActiveAdmin(organizationId, userIdToExclude) {
        const activeOrgAdminCount = await this.prisma.user.count({
            where: {
                organizationId,
                isActive: true,
                role: client_1.UserRole.ORG_ADMIN,
                ...(userIdToExclude ? { id: { not: userIdToExclude } } : {}),
            },
        });
        if (activeOrgAdminCount < 1) {
            throw new common_1.BadRequestException("Au moins un ORG_ADMIN actif est requis dans l'organisation");
        }
    }
};
exports.TeamService = TeamService;
exports.TeamService = TeamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], TeamService);
//# sourceMappingURL=team.service.js.map