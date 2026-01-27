import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MetricsService } from '../metrics/metrics.service';
import { PlatformSubscriptionService } from '../platform-subscription/platform-subscription.service';
export type StripeRawBodyRequest = {
    rawBody?: Buffer | string;
};
export declare class StripeWebhookService {
    private readonly config;
    private readonly prisma;
    private readonly channelAccessService;
    private readonly auditLogService;
    private readonly metricsService;
    private readonly platformSubscriptionService;
    private readonly logger;
    private readonly stripe;
    constructor(config: ConfigService, prisma: PrismaService, channelAccessService: ChannelAccessService, auditLogService: AuditLogService, metricsService: MetricsService, platformSubscriptionService: PlatformSubscriptionService);
    handleWebhook(signature: string, request: StripeRawBodyRequest): Promise<void>;
    private processEvent;
    private resolveContext;
    private contextFromMetadata;
    private contextFromSubscription;
    private contextFromStripeAccount;
    private syncSubscriptionFromCheckout;
    private isUuid;
    private getMetadataString;
    private mapEventType;
    private isConnectEventExpected;
    private applyDomainSideEffects;
    private subscriptionStatusForEvent;
    private handleAccountUpdated;
    private isPlatformEvent;
    private extractMetadataFromEvent;
}
