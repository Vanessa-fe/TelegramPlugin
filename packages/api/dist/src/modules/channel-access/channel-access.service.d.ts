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
    confirmManualGrant(accessId: string, organizationId?: string | null): Promise<{
        channel: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            externalId: string;
            provider: $Enums.ChannelProvider;
            type: $Enums.ChannelType;
            inviteLink: string | null;
            title: string | null;
            username: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: $Enums.AccessStatus;
        customerId: string;
        subscriptionId: string;
        channelId: string;
        inviteId: string | null;
        discordRoleId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }>;
    confirmManualRevoke(accessId: string, organizationId?: string | null): Promise<{
        channel: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            externalId: string;
            provider: $Enums.ChannelProvider;
            type: $Enums.ChannelType;
            inviteLink: string | null;
            title: string | null;
            username: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: $Enums.AccessStatus;
        customerId: string;
        subscriptionId: string;
        channelId: string;
        inviteId: string | null;
        discordRoleId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }>;
}
