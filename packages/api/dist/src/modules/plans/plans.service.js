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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PlansService = class PlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(params) {
        const where = {};
        if (params.productId) {
            where.productId = params.productId;
        }
        if (params.organizationId) {
            where.product = { organizationId: params.organizationId };
        }
        if (!params.includeInactive) {
            where.isActive = true;
        }
        return this.prisma.plan.findMany({
            where: Object.keys(where).length ? where : undefined,
            include: {
                product: true,
                subscriptions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.plan.findUniqueOrThrow({
            where: { id },
            include: {
                product: true,
                subscriptions: true,
            },
        });
    }
    create(data) {
        const payload = {
            name: data.name.trim(),
            description: data.description,
            interval: data.interval,
            priceCents: data.priceCents,
            currency: data.currency,
            trialPeriodDays: data.trialPeriodDays,
            accessDurationDays: data.accessDurationDays,
            isActive: data.isActive ?? true,
            metadata: data.metadata,
            product: {
                connect: { id: data.productId },
            },
        };
        return this.prisma.plan.create({ data: payload });
    }
    update(id, data) {
        const payload = {
            ...(data.productId && {
                product: { connect: { id: data.productId } },
            }),
            ...(data.name !== undefined && { name: data.name.trim() }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.interval !== undefined && { interval: data.interval }),
            ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
            ...(data.currency !== undefined && { currency: data.currency }),
            ...(data.trialPeriodDays !== undefined && {
                trialPeriodDays: data.trialPeriodDays,
            }),
            ...(data.accessDurationDays !== undefined && {
                accessDurationDays: data.accessDurationDays,
            }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
        };
        return this.prisma.plan.update({
            where: { id },
            data: payload,
        });
    }
    async getProductOrganization(productId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: { organizationId: true },
        });
        return product?.organizationId ?? null;
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlansService);
//# sourceMappingURL=plans.service.js.map