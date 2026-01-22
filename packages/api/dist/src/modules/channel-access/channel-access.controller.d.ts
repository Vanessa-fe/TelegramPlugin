import { ChannelAccessService } from './channel-access.service';
export declare class ChannelAccessController {
    private readonly channelAccessService;
    constructor(channelAccessService: ChannelAccessService);
    grantAccess(body: {
        subscriptionId: string;
        channelId: string;
        customerId: string;
    }): Promise<{
        message: string;
    }>;
    revokeAccess(body: {
        subscriptionId: string;
        reason: 'payment_failed' | 'canceled' | 'manual' | 'refund';
    }): Promise<{
        message: string;
    }>;
}
