import { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { ChannelAccessService } from './channel-access.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { AuditLogService } from '../audit-log/audit-log.service';
export declare class ChannelAccessController {
    private readonly channelAccessService;
    private readonly channelAccessQueue;
    private readonly auditLogService;
    constructor(channelAccessService: ChannelAccessService, channelAccessQueue: ChannelAccessQueue, auditLogService: AuditLogService);
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
    replayDeadLetter(user: AuthUser, body: {
        queue: 'grant' | 'revoke';
        jobId: string;
    }, correlationId?: string, requestId?: string): Promise<{
        message: string;
    }>;
    supportGrantAccess(user: AuthUser, body: {
        subscriptionId: string;
    }, correlationId?: string, requestId?: string): Promise<{
        message: string;
    }>;
    supportRevokeAccess(user: AuthUser, body: {
        subscriptionId: string;
        reason: 'payment_failed' | 'canceled' | 'manual' | 'refund';
    }, correlationId?: string, requestId?: string): Promise<{
        message: string;
    }>;
    supportReplayDeadLetter(user: AuthUser, body: {
        queue: 'grant' | 'revoke';
        jobId: string;
    }, correlationId?: string, requestId?: string): Promise<{
        message: string;
    }>;
    confirmManualGrant(user: AuthUser, body: {
        accessId: string;
    }): Promise<{
        channel: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            metadata: Prisma.JsonValue | null;
            externalId: string;
            provider: import("@prisma/client").$Enums.ChannelProvider;
            type: import("@prisma/client").$Enums.ChannelType;
            inviteLink: string | null;
            title: string | null;
            username: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue | null;
        status: import("@prisma/client").$Enums.AccessStatus;
        customerId: string;
        subscriptionId: string;
        channelId: string;
        inviteId: string | null;
        discordRoleId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }>;
    confirmManualRevoke(user: AuthUser, body: {
        accessId: string;
    }): Promise<{
        channel: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            metadata: Prisma.JsonValue | null;
            externalId: string;
            provider: import("@prisma/client").$Enums.ChannelProvider;
            type: import("@prisma/client").$Enums.ChannelType;
            inviteLink: string | null;
            title: string | null;
            username: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue | null;
        status: import("@prisma/client").$Enums.AccessStatus;
        customerId: string;
        subscriptionId: string;
        channelId: string;
        inviteId: string | null;
        discordRoleId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }>;
    private parseSubscriptionId;
    private resolveCorrelationId;
    private buildAuditMetadata;
}
