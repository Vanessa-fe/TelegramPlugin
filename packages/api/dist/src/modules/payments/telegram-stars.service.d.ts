import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
export interface TelegramStarsPayload {
    telegramPaymentChargeId: string;
    telegramUserId: string;
    totalAmount: number;
    invoicePayload: string;
    providerPaymentChargeId?: string;
}
export interface TelegramStarsCustomerInput {
    telegramUserId: string;
    telegramUsername?: string;
    displayName?: string;
}
export interface TelegramStarsInvoice {
    subscriptionId: string;
    title: string;
    description: string;
    payload: string;
    currency: 'XTR';
    prices: Array<{
        label: string;
        amount: number;
    }>;
}
export declare class TelegramStarsService {
    private readonly prisma;
    private readonly channelAccessService;
    private readonly config;
    private readonly logger;
    private readonly starsConversionRate;
    constructor(prisma: PrismaService, channelAccessService: ChannelAccessService, config: ConfigService);
    private convertCentsToStars;
    private convertStarsToCents;
    handleSuccessfulPayment(payload: TelegramStarsPayload): Promise<void>;
    createInvoice(planId: string, customer: TelegramStarsCustomerInput): Promise<TelegramStarsInvoice>;
    validatePreCheckout(invoicePayload: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    private calculatePeriodEnd;
}
