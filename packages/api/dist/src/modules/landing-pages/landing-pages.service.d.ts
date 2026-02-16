import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { CreateLandingPageDto, UpdateLandingPageDto, CreateElementDto, UpdateElementDto, BulkUpdateElementsDto, ReorderElementsDto, UpdateSocialLinksDto, UpdatePageSlugDto } from './landing-pages.schema';
export declare class LandingPagesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByOrganization(organizationId: string): Promise<({
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
    getOrganizationSlug(organizationId: string): Promise<{
        slug: string;
        pageSlug: string | null;
    } | null>;
    updatePageSlug(organizationId: string, dto: UpdatePageSlugDto): Promise<{
        slug: string;
        pageSlug: string | null;
    }>;
    create(organizationId: string, dto: CreateLandingPageDto): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    update(organizationId: string, dto: UpdateLandingPageDto): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    publish(organizationId: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    unpublish(organizationId: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    addElement(organizationId: string, dto: CreateElementDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.LandingPageElementType;
        order: number;
        content: string | null;
        imageUrl: string | null;
        linkUrl: string | null;
        settings: Prisma.JsonValue | null;
        landingPageId: string;
    }>;
    updateElement(organizationId: string, elementId: string, dto: UpdateElementDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.LandingPageElementType;
        order: number;
        content: string | null;
        imageUrl: string | null;
        linkUrl: string | null;
        settings: Prisma.JsonValue | null;
        landingPageId: string;
    }>;
    deleteElement(organizationId: string, elementId: string): Promise<{
        success: boolean;
    }>;
    bulkUpdateElements(organizationId: string, dto: BulkUpdateElementsDto): Promise<({
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
    reorderElements(organizationId: string, dto: ReorderElementsDto): Promise<({
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
    updateSocialLinks(organizationId: string, dto: UpdateSocialLinksDto): Promise<({
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: Prisma.JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
    getPublicPage(creatorSlug: string, pageSlug?: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
            pageSlug: string | null;
            branding: {
                logoUrl: string | null;
                hideSublynkBranding: boolean;
            };
        };
        landingPage: {
            id: string;
            themeColor: string | null;
            metaTitle: string | null;
            metaDescription: string | null;
            elements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: import("@prisma/client").$Enums.LandingPageElementType;
                order: number;
                content: string | null;
                imageUrl: string | null;
                linkUrl: string | null;
                settings: Prisma.JsonValue | null;
                landingPageId: string;
            }[];
            socialLinks: {
                id: string;
                url: string;
                platform: import("@prisma/client").$Enums.SocialPlatform;
                order: number;
                landingPageId: string;
            }[];
        };
        products: {
            id: string;
            name: string;
            description: string | null;
            plans: {
                id: string;
                name: string;
                priceCents: number;
                currency: string;
                interval: import("@prisma/client").$Enums.PlanInterval;
                trialPeriodDays: number | null;
                description: string | null;
                accessDurationDays: number | null;
            }[];
            channels: {
                id: string;
                title: string | null;
                provider: import("@prisma/client").$Enums.ChannelProvider;
            }[];
        }[];
    } | null>;
}
