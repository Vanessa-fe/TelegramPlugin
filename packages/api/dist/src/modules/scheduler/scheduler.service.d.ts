import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
export declare class SchedulerService {
    private readonly prisma;
    private readonly channelAccessService;
    private readonly logger;
    constructor(prisma: PrismaService, channelAccessService: ChannelAccessService);
    handleExpiredEntitlements(): Promise<void>;
    handleExpiredChannelAccesses(): Promise<void>;
    cleanupOldInvites(): Promise<void>;
    sendExpirationReminders(): Promise<void>;
}
