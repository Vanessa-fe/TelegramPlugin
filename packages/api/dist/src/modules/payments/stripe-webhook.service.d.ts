import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
export type StripeRawBodyRequest = {
    rawBody?: Buffer | string;
};
export declare class StripeWebhookService {
    private readonly config;
    private readonly prisma;
    private readonly channelAccessService;
    private readonly logger;
    private readonly stripe;
    constructor(config: ConfigService, prisma: PrismaService, channelAccessService: ChannelAccessService);
    handleWebhook(signature: string, request: StripeRawBodyRequest): Promise<void>;
    private processEvent;
    private resolveContext;
    private contextFromMetadata;
    private contextFromSubscription;
    private syncSubscriptionFromCheckout;
    private isUuid;
    private getMetadataString;
    private mapEventType;
    private applyDomainSideEffects;
    private subscriptionStatusForEvent;
}
