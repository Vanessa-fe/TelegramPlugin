import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCheckoutDto } from './billing.schema';
type StripeStatus = {
    saasActive: boolean;
    connected: boolean;
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
};
export declare class BillingService {
    private readonly config;
    private readonly prisma;
    private readonly stripe;
    constructor(config: ConfigService, prisma: PrismaService);
    getStripeStatus(organizationId: string): Promise<StripeStatus>;
    createStripeConnectLink(organizationId: string): Promise<{
        url: string;
    }>;
    createStripeLoginLink(organizationId: string): Promise<{
        url: string;
    }>;
    createCheckoutSession(payload: CreateCheckoutDto): Promise<{
        url: string;
        subscriptionId: string;
    }>;
    private mapRecurring;
}
export {};
