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
exports.StorefrontService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let StorefrontService = class StorefrontService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublicProduct(productId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        saasActive: true,
                        stripeAccountId: true,
                    },
                },
                plans: {
                    where: { isActive: true },
                    orderBy: { priceCents: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        interval: true,
                        priceCents: true,
                        currency: true,
                        trialPeriodDays: true,
                        accessDurationDays: true,
                    },
                },
                channels: {
                    include: {
                        channel: {
                            select: {
                                id: true,
                                title: true,
                                provider: true,
                            },
                        },
                    },
                },
            },
        });
        if (!product) {
            return null;
        }
        if (product.status !== client_1.ProductStatus.ACTIVE ||
            !product.organization.saasActive ||
            !product.organization.stripeAccountId) {
            return null;
        }
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            organization: {
                id: product.organization.id,
                name: product.organization.name,
                slug: product.organization.slug,
            },
            plans: product.plans,
            channels: product.channels.map((pc) => ({
                id: pc.channel.id,
                title: pc.channel.title,
                provider: pc.channel.provider,
            })),
        };
    }
    async getPublicOrganization(slug) {
        const organization = await this.prisma.organization.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                saasActive: true,
                stripeAccountId: true,
            },
        });
        if (!organization ||
            !organization.saasActive ||
            !organization.stripeAccountId) {
            return null;
        }
        return {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
        };
    }
    async getPublicProductsByOrganization(slug) {
        const organization = await this.prisma.organization.findUnique({
            where: { slug },
            select: {
                id: true,
                saasActive: true,
                stripeAccountId: true,
            },
        });
        if (!organization ||
            !organization.saasActive ||
            !organization.stripeAccountId) {
            return [];
        }
        const products = await this.prisma.product.findMany({
            where: {
                organizationId: organization.id,
                status: client_1.ProductStatus.ACTIVE,
            },
            include: {
                plans: {
                    where: { isActive: true },
                    orderBy: { priceCents: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        interval: true,
                        priceCents: true,
                        currency: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            plans: product.plans,
        }));
    }
};
exports.StorefrontService = StorefrontService;
exports.StorefrontService = StorefrontService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StorefrontService);
//# sourceMappingURL=storefront.service.js.map