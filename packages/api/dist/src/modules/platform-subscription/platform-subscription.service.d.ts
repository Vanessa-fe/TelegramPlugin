import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import type { PlatformPlanResponse, PlatformSubscriptionResponse } from './platform-subscription.schema';
export declare class PlatformSubscriptionService {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    private readonly stripe;
    constructor(config: ConfigService, prisma: PrismaService);
    getPlans(): Promise<PlatformPlanResponse[]>;
    getSubscription(organizationId: string): Promise<PlatformSubscriptionResponse | null>;
    createCheckoutSession(organizationId: string, planName: string): Promise<{
        url: string;
    }>;
    createPortalSession(organizationId: string): Promise<{
        url: string;
    }>;
    cancelSubscription(organizationId: string): Promise<void>;
    handleWebhookEvent(event: Stripe.Event): Promise<void>;
    private handleCheckoutCompleted;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
    private handleInvoicePaymentSucceeded;
    private handleInvoicePaymentFailed;
    private updateSubscriptionFromStripe;
    updateSaasActive(organizationId: string): Promise<void>;
    private mapStripeStatus;
}
