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
exports.LandingPagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let LandingPagesService = class LandingPagesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByOrganization(organizationId) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
            include: {
                elements: {
                    orderBy: { order: 'asc' },
                },
                socialLinks: {
                    orderBy: { order: 'asc' },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
        return landingPage;
    }
    async getOrganizationSlug(organizationId) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { slug: true, pageSlug: true },
        });
        return organization;
    }
    async updatePageSlug(organizationId, dto) {
        return this.prisma.organization.update({
            where: { id: organizationId },
            data: { pageSlug: dto.pageSlug ?? null },
            select: { slug: true, pageSlug: true },
        });
    }
    async create(organizationId, dto) {
        const existing = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (existing) {
            throw new common_1.ConflictException('Landing page already exists for this organization');
        }
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
        });
        const landingPage = await this.prisma.landingPage.create({
            data: {
                organizationId,
                themeColor: dto.themeColor ?? '#7c3aed',
                metaTitle: dto.metaTitle,
                metaDescription: dto.metaDescription,
                elements: {
                    create: [
                        {
                            type: client_1.LandingPageElementType.IMAGE,
                            order: 0,
                            content: null,
                            imageUrl: null,
                        },
                        {
                            type: client_1.LandingPageElementType.HEADING_1,
                            order: 1,
                            content: organization?.name ?? 'Mon espace',
                        },
                        {
                            type: client_1.LandingPageElementType.TEXT,
                            order: 2,
                            content: 'Bienvenue ! Découvrez mes offres exclusives.',
                        },
                        {
                            type: client_1.LandingPageElementType.HEADING_3,
                            order: 3,
                            content: 'Mes offres',
                        },
                        {
                            type: client_1.LandingPageElementType.PRODUCTS,
                            order: 4,
                        },
                    ],
                },
            },
            include: {
                elements: {
                    orderBy: { order: 'asc' },
                },
                socialLinks: {
                    orderBy: { order: 'asc' },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
        return landingPage;
    }
    async update(organizationId, dto) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page not found');
        }
        return this.prisma.landingPage.update({
            where: { organizationId },
            data: dto,
            include: {
                elements: {
                    orderBy: { order: 'asc' },
                },
                socialLinks: {
                    orderBy: { order: 'asc' },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
    }
    async publish(organizationId) {
        return this.update(organizationId, { isPublished: true });
    }
    async unpublish(organizationId) {
        return this.update(organizationId, { isPublished: false });
    }
    async addElement(organizationId, dto) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page not found');
        }
        return this.prisma.landingPageElement.create({
            data: {
                landingPageId: landingPage.id,
                type: dto.type,
                order: dto.order,
                content: dto.content ?? null,
                imageUrl: dto.imageUrl ?? null,
                linkUrl: dto.linkUrl ?? null,
                settings: dto.settings ?? client_1.Prisma.JsonNull,
            },
        });
    }
    async updateElement(organizationId, elementId, dto) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page not found');
        }
        const element = await this.prisma.landingPageElement.findFirst({
            where: {
                id: elementId,
                landingPageId: landingPage.id,
            },
        });
        if (!element) {
            throw new common_1.NotFoundException('Element not found');
        }
        return this.prisma.landingPageElement.update({
            where: { id: elementId },
            data: dto,
        });
    }
    async deleteElement(organizationId, elementId) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page not found');
        }
        const element = await this.prisma.landingPageElement.findFirst({
            where: {
                id: elementId,
                landingPageId: landingPage.id,
            },
        });
        if (!element) {
            throw new common_1.NotFoundException('Element not found');
        }
        await this.prisma.landingPageElement.delete({
            where: { id: elementId },
        });
        return { success: true };
    }
    async bulkUpdateElements(organizationId, dto) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page not found');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.landingPageElement.deleteMany({
                where: { landingPageId: landingPage.id },
            });
            await tx.landingPageElement.createMany({
                data: dto.elements.map((el, index) => ({
                    landingPageId: landingPage.id,
                    type: el.type,
                    order: el.order ?? index,
                    content: el.content ?? null,
                    imageUrl: el.imageUrl ?? null,
                    linkUrl: el.linkUrl ?? null,
                    settings: el.settings ?? client_1.Prisma.JsonNull,
                })),
            });
        });
        return this.findByOrganization(organizationId);
    }
    async reorderElements(organizationId, dto) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page not found');
        }
        await this.prisma.$transaction(dto.elementIds.map((id, index) => this.prisma.landingPageElement.update({
            where: { id },
            data: { order: index },
        })));
        return this.findByOrganization(organizationId);
    }
    async updateSocialLinks(organizationId, dto) {
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page not found');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.socialLink.deleteMany({
                where: { landingPageId: landingPage.id },
            });
            if (dto.socialLinks.length > 0) {
                await tx.socialLink.createMany({
                    data: dto.socialLinks.map((link) => ({
                        landingPageId: landingPage.id,
                        platform: link.platform,
                        url: link.url,
                        order: link.order,
                    })),
                });
            }
        });
        return this.findByOrganization(organizationId);
    }
    async getPublicPage(creatorSlug, pageSlug) {
        const organization = await this.prisma.organization.findUnique({
            where: { slug: creatorSlug },
            select: {
                id: true,
                name: true,
                slug: true,
                pageSlug: true,
                saasActive: true,
                stripeAccountId: true,
            },
        });
        if (!organization) {
            return null;
        }
        if (pageSlug && organization.pageSlug !== pageSlug) {
            return null;
        }
        const landingPage = await this.prisma.landingPage.findUnique({
            where: { organizationId: organization.id },
            include: {
                elements: {
                    orderBy: { order: 'asc' },
                },
                socialLinks: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!landingPage) {
            return null;
        }
        const products = await this.prisma.product.findMany({
            where: {
                organizationId: organization.id,
                status: 'ACTIVE',
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
            orderBy: { createdAt: 'desc' },
        });
        return {
            organization: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                pageSlug: organization.pageSlug,
            },
            landingPage: {
                id: landingPage.id,
                themeColor: landingPage.themeColor,
                metaTitle: landingPage.metaTitle,
                metaDescription: landingPage.metaDescription,
                elements: landingPage.elements,
                socialLinks: landingPage.socialLinks,
            },
            products: products.map((product) => ({
                id: product.id,
                name: product.name,
                description: product.description,
                plans: product.plans,
                channels: product.channels.map((pc) => ({
                    id: pc.channel.id,
                    title: pc.channel.title,
                    provider: pc.channel.provider,
                })),
            })),
        };
    }
};
exports.LandingPagesService = LandingPagesService;
exports.LandingPagesService = LandingPagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LandingPagesService);
//# sourceMappingURL=landing-pages.service.js.map