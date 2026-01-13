import { $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessQueue } from './channel-access.queue';
export declare class ChannelAccessService {
    private readonly prisma;
    private readonly queue;
    private readonly logger;
    constructor(prisma: PrismaService, queue: ChannelAccessQueue);
    handlePaymentSuccess(subscriptionId: string, provider: $Enums.PaymentProvider): Promise<void>;
    handlePaymentFailure(subscriptionId: string, reason: 'payment_failed' | 'canceled' | 'refund'): Promise<void>;
}
