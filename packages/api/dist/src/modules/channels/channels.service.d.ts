import { PrismaService } from '../../prisma/prisma.service';
import type { CreateChannelDto, UpdateChannelDto } from './channels.schema';
export declare class ChannelsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string): Promise<{
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
    findOne(id: string): Promise<{
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
    create(dto: CreateChannelDto): Promise<{
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
    update(id: string, dto: UpdateChannelDto): Promise<{
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
    getAccesses(channelId: string): Promise<{
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
