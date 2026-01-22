import { $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ChannelAccessService {
    private readonly prisma;
    private readonly queue;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, queue: ChannelAccessQueue, notifications: NotificationsService);
    handlePaymentSuccess(subscriptionId: string, provider: $Enums.PaymentProvider): Promise<void>;
    handlePaymentFailure(subscriptionId: string, reason: 'payment_failed' | 'canceled' | 'refund' | 'expired'): Promise<void>;
}
