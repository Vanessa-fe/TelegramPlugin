import type { CreateChannelDto, UpdateChannelDto } from './channels.schema';
import { ChannelsService } from './channels.service';
import type { AuthUser } from '../auth/auth.types';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    findAll(user: AuthUser, organizationId?: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        externalId: string;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        inviteLink: string | null;
        title: string | null;
        username: string | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        externalId: string;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        inviteLink: string | null;
        title: string | null;
        username: string | null;
    }>;
    create(user: AuthUser, body: CreateChannelDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        externalId: string;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        inviteLink: string | null;
        title: string | null;
        username: string | null;
    }>;
    update(user: AuthUser, id: string, body: UpdateChannelDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        externalId: string;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        inviteLink: string | null;
        title: string | null;
        username: string | null;
    }>;
    getAccesses(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.AccessStatus;
        customerId: string;
        subscriptionId: string;
        channelId: string;
        inviteId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }[]>;
}
