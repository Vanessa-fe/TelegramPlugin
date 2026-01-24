import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { DataExportsService } from '../data-exports/data-exports.service';
export declare class SchedulerService {
    private readonly prisma;
    private readonly channelAccessService;
    private readonly config;
    private readonly dataExportsService;
    private readonly logger;
    constructor(prisma: PrismaService, channelAccessService: ChannelAccessService, config: ConfigService, dataExportsService: DataExportsService);
    handleExpiredEntitlements(): Promise<void>;
    handleExpiredGracePeriods(): Promise<void>;
    handleExpiredChannelAccesses(): Promise<void>;
    cleanupOldInvites(): Promise<void>;
    sendExpirationReminders(): Promise<void>;
    cleanupRetentionData(): Promise<void>;
    handlePendingDataExports(): Promise<void>;
    private getRetentionDays;
}
