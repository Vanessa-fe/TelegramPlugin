import type { AuthUser } from '../auth/auth.types';
import { type CreateCheckoutDto } from './billing.schema';
import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    getStripeStatus(user: AuthUser, organizationId?: string): Promise<{
        saasActive: boolean;
        connected: boolean;
        accountId?: string;
        chargesEnabled?: boolean;
        payoutsEnabled?: boolean;
        detailsSubmitted?: boolean;
    }>;
    createStripeConnectLink(user: AuthUser, organizationId?: string): Promise<{
        url: string;
    }>;
    createStripeLoginLink(user: AuthUser, organizationId?: string): Promise<{
        url: string;
    }>;
    createCheckoutSession(body: CreateCheckoutDto): Promise<{
        url: string;
        subscriptionId: string;
    }>;
}
