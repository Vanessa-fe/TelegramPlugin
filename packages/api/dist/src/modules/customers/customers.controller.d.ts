import type { CreateCustomerDto, UpdateCustomerDto } from './customers.schema';
import { CustomersService } from './customers.service';
import type { AuthUser } from '../auth/auth.types';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(user: AuthUser, organizationId?: string): Promise<({
        organization: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            billingEmail: string;
            stripeAccountId: string | null;
            saasActive: boolean;
            timezone: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
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
        channelAccesses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            status: import("@prisma/client").$Enums.AccessStatus;
            customerId: string;
            subscriptionId: string;
            channelId: string;
            inviteId: string | null;
            grantedAt: Date | null;
            revokedAt: Date | null;
            revokeReason: string | null;
        }[];
    } & {
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
        externalId: string | null;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        organization: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            billingEmail: string;
            stripeAccountId: string | null;
            saasActive: boolean;
            timezone: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
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
        channelAccesses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            status: import("@prisma/client").$Enums.AccessStatus;
            customerId: string;
            subscriptionId: string;
            channelId: string;
            inviteId: string | null;
            grantedAt: Date | null;
            revokedAt: Date | null;
            revokeReason: string | null;
        }[];
    } & {
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
        externalId: string | null;
    }>;
    create(user: AuthUser, body: CreateCustomerDto): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
        externalId: string | null;
    }>;
    update(user: AuthUser, id: string, body: UpdateCustomerDto): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
        externalId: string | null;
    }>;
}
