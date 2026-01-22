import { StorefrontService } from './storefront.service';
export declare class StorefrontController {
    private readonly storefrontService;
    constructor(storefrontService: StorefrontService);
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
            description: string | null;
            interval: import("@prisma/client").$Enums.PlanInterval;
            priceCents: number;
            currency: string;
            trialPeriodDays: number | null;
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
            description: string | null;
            interval: import("@prisma/client").$Enums.PlanInterval;
            priceCents: number;
            currency: string;
        }[];
    }[]>;
}
