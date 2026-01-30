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
exports.EntitlementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EntitlementsService = class EntitlementsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const entitlements = await this.prisma.entitlement.findMany({
            where: {
                subscriptionId: params?.subscriptionId,
                customerId: params?.customerId,
                entitlementKey: params?.entitlementKey,
            },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
                customer: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const channelIds = entitlements
            .filter((e) => e.type === 'CHANNEL_ACCESS' && e.resourceId)
            .map((e) => e.resourceId);
        const channels = channelIds.length > 0
            ? await this.prisma.channel.findMany({
                where: { id: { in: channelIds } },
                select: { id: true, title: true, username: true },
            })
            : [];
        const channelMap = new Map(channels.map((c) => [c.id, c]));
        return entitlements.map((entitlement) => ({
            ...entitlement,
            channel: entitlement.type === 'CHANNEL_ACCESS' &&
                entitlement.resourceId
                ? channelMap.get(entitlement.resourceId) || null
                : null,
        }));
    }
    async findOne(id) {
        const entitlement = await this.prisma.entitlement.findUnique({
            where: { id },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
                customer: true,
            },
        });
        if (!entitlement) {
            throw new common_1.NotFoundException(`Entitlement with ID ${id} not found`);
        }
        let channel = null;
        if (entitlement.type === 'CHANNEL_ACCESS' &&
            entitlement.resourceId) {
            channel = await this.prisma.channel.findUnique({
                where: { id: entitlement.resourceId },
                select: { id: true, title: true, username: true },
            });
        }
        return { ...entitlement, channel };
    }
    async create(dto) {
        return this.prisma.entitlement.create({
            data: {
                subscriptionId: dto.subscriptionId,
                customerId: dto.customerId,
                entitlementKey: dto.entitlementKey,
                type: dto.type,
                resourceId: dto.resourceId,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                metadata: dto.metadata,
            },
            include: {
                subscription: true,
                customer: true,
            },
        });
    }
    async update(id, dto) {
        return this.prisma.entitlement.update({
            where: { id },
            data: {
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
                revokedAt: dto.revokedAt ? new Date(dto.revokedAt) : undefined,
                revokeReason: dto.revokeReason,
                metadata: dto.metadata,
            },
            include: {
                subscription: true,
                customer: true,
            },
        });
    }
    async revoke(id, reason) {
        return this.prisma.entitlement.update({
            where: { id },
            data: {
                revokedAt: new Date(),
                revokeReason: reason,
            },
        });
    }
    async checkEntitlement(customerId, entitlementKey) {
        const entitlement = await this.prisma.entitlement.findFirst({
            where: {
                customerId,
                entitlementKey,
                revokedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
        });
        return !!entitlement;
    }
    async getActiveEntitlements(customerId) {
        return this.prisma.entitlement.findMany({
            where: {
                customerId,
                revokedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: {
                subscription: true,
            },
            orderBy: { grantedAt: 'desc' },
        });
    }
};
exports.EntitlementsService = EntitlementsService;
exports.EntitlementsService = EntitlementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EntitlementsService);
//# sourceMappingURL=entitlements.service.js.map