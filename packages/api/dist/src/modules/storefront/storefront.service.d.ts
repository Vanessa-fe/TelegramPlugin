import { PrismaService } from '../../prisma/prisma.service';
export declare class StorefrontService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicProduct(productId: string): Promise<{
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
    } | null>;
    getPublicOrganization(slug: string): Promise<{
        id: string;
        name: string;
        slug: string;
    } | null>;
    getPublicProductsByOrganization(slug: string): Promise<{
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
}
