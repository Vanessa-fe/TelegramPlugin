import type { CreatePlanDto, UpdatePlanDto } from './plans.schema';
import { PlansService } from './plans.service';
import type { AuthUser } from '../auth/auth.types';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findAll(user: AuthUser, productId?: string, organizationId?: string, includeInactive?: string): Promise<({
        product: {
            organizationId: string;
            status: import("@prisma/client").$Enums.ProductStatus;
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
        };
        subscriptions: {
            organizationId: string;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            externalId: string | null;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
            customerId: string;
            planId: string;
            externalCustomerId: string | null;
            externalPriceId: string | null;
            currentPeriodStart: Date | null;
            currentPeriodEnd: Date | null;
            trialEndsAt: Date | null;
            canceledAt: Date | null;
            endedAt: Date | null;
            startedAt: Date;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        productId: string;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        isActive: boolean;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        product: {
            organizationId: string;
            status: import("@prisma/client").$Enums.ProductStatus;
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
        };
        subscriptions: {
            organizationId: string;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            externalId: string | null;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
            customerId: string;
            planId: string;
            externalCustomerId: string | null;
            externalPriceId: string | null;
            currentPeriodStart: Date | null;
            currentPeriodEnd: Date | null;
            trialEndsAt: Date | null;
            canceledAt: Date | null;
            endedAt: Date | null;
            startedAt: Date;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        productId: string;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        isActive: boolean;
    }>;
    create(user: AuthUser, body: CreatePlanDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        productId: string;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        isActive: boolean;
    }>;
    update(user: AuthUser, id: string, body: UpdatePlanDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        productId: string;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        isActive: boolean;
    }>;
}
