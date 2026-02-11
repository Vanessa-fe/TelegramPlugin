import { StorefrontService } from './storefront.service';
import { LandingPagesService } from '../landing-pages/landing-pages.service';
export declare class StorefrontController {
    private readonly storefrontService;
    private readonly landingPagesService;
    constructor(storefrontService: StorefrontService, landingPagesService: LandingPagesService);
    getProduct(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        organization: {
            id: string;
            name: string;
            slug: string;
        };
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
    }>;
    getProductBySlug(slug: string, productSlug: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        organization: {
            id: string;
            name: string;
            slug: string;
        };
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
    }>;
    getOrganizationBySlug(slug: string): Promise<{
        id: string;
        name: string;
        slug: string;
    }>;
    getOrganizationProducts(slug: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        plans: {
            id: string;
            name: string;
            priceCents: number;
            currency: string;
            interval: import("@prisma/client").$Enums.PlanInterval;
            description: string | null;
        }[];
    }[]>;
    getPublicLandingPage(creator: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
            pageSlug: string | null;
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
                settings: import("@prisma/client/runtime/library").JsonValue | null;
                landingPageId: string;
            }[];
            socialLinks: {
                id: string;
                platform: import("@prisma/client").$Enums.SocialPlatform;
                url: string;
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
    }>;
    getPublicLandingPageWithSlug(creator: string, pageSlug: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
            pageSlug: string | null;
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
                settings: import("@prisma/client/runtime/library").JsonValue | null;
                landingPageId: string;
            }[];
            socialLinks: {
                id: string;
                platform: import("@prisma/client").$Enums.SocialPlatform;
                url: string;
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
    }>;
}
