import type { AuthUser } from '../auth/auth.types';
import { type CreatePlatformCheckoutDto } from './platform-subscription.schema';
import { PlatformSubscriptionService } from './platform-subscription.service';
export declare class PlatformSubscriptionController {
    private readonly platformSubscriptionService;
    constructor(platformSubscriptionService: PlatformSubscriptionService);
    getPlans(): Promise<{
        id: string;
        name: string;
        displayName: string;
        priceCents: number;
        currency: string;
        interval: string;
        trialPeriodDays: number | null;
        features: Record<string, unknown> | null;
        isActive: boolean;
        sortOrder: number;
    }[]>;
    getSubscription(user: AuthUser, organizationId?: string): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "EXPIRED";
        stripeSubscriptionId: string | null;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        trialEndsAt: Date | null;
        canceledAt: Date | null;
        cancelAtPeriodEnd: boolean;
        graceUntil: Date | null;
        plan: {
            id: string;
            name: string;
            displayName: string;
            priceCents: number;
            currency: string;
            interval: string;
            trialPeriodDays: number | null;
            features: Record<string, unknown> | null;
            isActive: boolean;
            sortOrder: number;
        } | null;
        isGrandfathered: boolean;
    } | null>;
    createCheckout(user: AuthUser, body: CreatePlatformCheckoutDto, organizationId?: string): Promise<{
        url: string;
    }>;
    createPortal(user: AuthUser, organizationId?: string): Promise<{
        url: string;
    }>;
    cancelSubscription(user: AuthUser, organizationId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
