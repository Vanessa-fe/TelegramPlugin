import type { CreateCustomerDto, UpdateCustomerDto } from './customers.schema';
import { CustomersService } from './customers.service';
import type { AuthUser } from '../auth/auth.types';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(user: AuthUser, organizationId?: string): Promise<({
        organization: {
            name: string;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
            slug: string;
            stripeAccountId: string | null;
            billingEmail: string;
            timezone: string | null;
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
        channelAccesses: {
            subscriptionId: string;
            status: import("@prisma/client").$Enums.AccessStatus;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
            customerId: string;
            channelId: string;
            inviteId: string | null;
            grantedAt: Date | null;
            revokedAt: Date | null;
            revokeReason: string | null;
        }[];
    } & {
        organizationId: string;
        externalId: string | null;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        email: string | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        organization: {
            name: string;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
            slug: string;
            stripeAccountId: string | null;
            billingEmail: string;
            timezone: string | null;
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
        channelAccesses: {
            subscriptionId: string;
            status: import("@prisma/client").$Enums.AccessStatus;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            updatedAt: Date;
            customerId: string;
            channelId: string;
            inviteId: string | null;
            grantedAt: Date | null;
            revokedAt: Date | null;
            revokeReason: string | null;
        }[];
    } & {
        organizationId: string;
        externalId: string | null;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        email: string | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
    }>;
    create(user: AuthUser, body: CreateCustomerDto): Promise<{
        organizationId: string;
        externalId: string | null;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        email: string | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
    }>;
    update(user: AuthUser, id: string, body: UpdateCustomerDto): Promise<{
        organizationId: string;
        externalId: string | null;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        email: string | null;
        displayName: string | null;
        telegramUserId: string | null;
        telegramUsername: string | null;
    }>;
}
