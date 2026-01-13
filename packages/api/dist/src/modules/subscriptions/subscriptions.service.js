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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let SubscriptionsService = class SubscriptionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(organizationId) {
        return this.prisma.subscription.findMany({
            where: organizationId ? { organizationId } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                plan: true,
                channelAccesses: true,
            },
        });
    }
    findOne(id) {
        return this.prisma.subscription.findUniqueOrThrow({
            where: { id },
            include: {
                customer: true,
                plan: true,
                channelAccesses: true,
            },
        });
    }
    create(data) {
        const payload = {
            organizationId: data.organizationId,
            customerId: data.customerId,
            planId: data.planId,
            status: data.status ?? client_1.SubscriptionStatus.ACTIVE,
            externalId: data.externalId,
            externalCustomerId: data.externalCustomerId,
            externalPriceId: data.externalPriceId,
            currentPeriodStart: data.currentPeriodStart,
            currentPeriodEnd: data.currentPeriodEnd,
            trialEndsAt: data.trialEndsAt,
            metadata: data.metadata,
        };
        return this.prisma.subscription.create({ data: payload });
    }
    update(id, data) {
        const payload = {
            ...(data.organizationId && { organizationId: data.organizationId }),
            ...(data.customerId && { customerId: data.customerId }),
            ...(data.planId && { planId: data.planId }),
            ...(data.status && { status: data.status }),
            ...(data.externalId && { externalId: data.externalId }),
            ...(data.externalCustomerId && {
                externalCustomerId: data.externalCustomerId,
            }),
            ...(data.externalPriceId && { externalPriceId: data.externalPriceId }),
            ...(data.currentPeriodStart && {
                currentPeriodStart: data.currentPeriodStart,
            }),
            ...(data.currentPeriodEnd && { currentPeriodEnd: data.currentPeriodEnd }),
            ...(data.trialEndsAt && { trialEndsAt: data.trialEndsAt }),
            ...(data.canceledAt && { canceledAt: data.canceledAt }),
            ...(data.endedAt && { endedAt: data.endedAt }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
        };
        return this.prisma.subscription.update({
            where: { id },
            data: payload,
        });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map