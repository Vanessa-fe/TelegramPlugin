import { ConfigService } from '@nestjs/config';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
export declare class ChannelAccessService {
    private readonly prisma;
    private readonly queue;
    private readonly notifications;
    private readonly config;
    private readonly auditLogService;
    private readonly logger;
    constructor(prisma: PrismaService, queue: ChannelAccessQueue, notifications: NotificationsService, config: ConfigService, auditLogService: AuditLogService);
    private getGracePeriodDays;
    handlePaymentSuccess(subscriptionId: string, provider: $Enums.PaymentProvider): Promise<void>;
    handlePaymentFailure(subscriptionId: string, reason: 'payment_failed' | 'canceled' | 'refund' | 'expired'): Promise<void>;
}
