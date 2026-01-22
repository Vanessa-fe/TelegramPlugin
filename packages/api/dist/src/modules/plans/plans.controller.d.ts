import type { CreatePlanDto, UpdatePlanDto } from './plans.schema';
import { PlansService } from './plans.service';
import type { AuthUser } from '../auth/auth.types';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findAll(user: AuthUser, productId?: string, organizationId?: string, includeInactive?: string): Promise<({
        subscriptions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            externalId: string | null;
            externalCustomerId: string | null;
            externalPriceId: string | null;
            startedAt: Date;
            currentPeriodStart: Date | null;
            currentPeriodEnd: Date | null;
            trialEndsAt: Date | null;
            canceledAt: Date | null;
            endedAt: Date | null;
            customerId: string;
            planId: string;
        }[];
        product: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            name: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            status: import("@prisma/client").$Enums.ProductStatus;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        productId: string;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        subscriptions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            externalId: string | null;
            externalCustomerId: string | null;
            externalPriceId: string | null;
            startedAt: Date;
            currentPeriodStart: Date | null;
            currentPeriodEnd: Date | null;
            trialEndsAt: Date | null;
            canceledAt: Date | null;
            endedAt: Date | null;
            customerId: string;
            planId: string;
        }[];
        product: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            name: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            status: import("@prisma/client").$Enums.ProductStatus;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        productId: string;
    }>;
    create(user: AuthUser, body: CreatePlanDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        productId: string;
    }>;
    update(user: AuthUser, id: string, body: UpdatePlanDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        interval: import("@prisma/client").$Enums.PlanInterval;
        priceCents: number;
        currency: string;
        trialPeriodDays: number | null;
        accessDurationDays: number | null;
        productId: string;
    }>;
}
