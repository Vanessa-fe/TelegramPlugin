import type { CreateChannelDto, UpdateChannelDto, StartVerificationDto, VerifyChannelDto, VerifyDiscordChannelDto, SetDiscordRoleDto } from './channels.schema';
import { ChannelsService } from './channels.service';
import type { AuthUser } from '../auth/auth.types';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    startVerification(user: AuthUser, body: StartVerificationDto): Promise<{
        id: string;
        code: string;
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        expiresAt: Date;
    }>;
    verifyFromBot(body: VerifyChannelDto): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    checkVerificationStatus(user: AuthUser, id: string): Promise<{
        status: "EXPIRED";
        provider: import("@prisma/client").$Enums.ChannelProvider;
        type?: undefined;
        telegramChatId?: undefined;
        telegramTitle?: undefined;
        telegramUsername?: undefined;
        discordGuildId?: undefined;
        discordGuildName?: undefined;
        discordRoleId?: undefined;
        discordRoleName?: undefined;
    } | {
        status: import("@prisma/client").$Enums.VerificationStatus;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        type: import("@prisma/client").$Enums.ChannelType;
        telegramChatId: string | null;
        telegramTitle: string | null;
        telegramUsername: string | null;
        discordGuildId: string | null;
        discordGuildName: string | null;
        discordRoleId: string | null;
        discordRoleName: string | null;
    }>;
    confirmVerification(user: AuthUser, id: string): Promise<{
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        id: string;
        organizationId: string;
        externalId: string;
        title: string | null;
        username: string | null;
        inviteLink: string | null;
        isActive: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    verifyDiscordFromBot(body: VerifyDiscordChannelDto): Promise<{
        success: boolean;
        message: string;
        guildId?: undefined;
    } | {
        success: boolean;
        guildId: string;
        message?: undefined;
    }>;
    setDiscordRole(user: AuthUser, id: string, body: SetDiscordRoleDto): Promise<{
        success: boolean;
    }>;
    confirmDiscordVerification(user: AuthUser, id: string): Promise<{
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        id: string;
        organizationId: string;
        externalId: string;
        title: string | null;
        username: string | null;
        inviteLink: string | null;
        isActive: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDiscordGuild(user: AuthUser, id: string): Promise<{
        channel: {
            type: import("@prisma/client").$Enums.ChannelType;
            provider: import("@prisma/client").$Enums.ChannelProvider;
            id: string;
            organizationId: string;
            externalId: string;
            title: string | null;
            username: string | null;
            inviteLink: string | null;
            isActive: boolean;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        status: import("@prisma/client").$Enums.InviteStatus;
        id: string;
        roleId: string | null;
        roleName: string | null;
        createdAt: Date;
        updatedAt: Date;
        channelId: string;
        guildId: string;
        guildName: string | null;
        botJoinedAt: Date | null;
    }>;
    updateDiscordRole(user: AuthUser, id: string, body: SetDiscordRoleDto): Promise<{
        status: import("@prisma/client").$Enums.InviteStatus;
        id: string;
        roleId: string | null;
        roleName: string | null;
        createdAt: Date;
        updatedAt: Date;
        channelId: string;
        guildId: string;
        guildName: string | null;
        botJoinedAt: Date | null;
    }>;
    findAll(user: AuthUser, organizationId?: string): Promise<{
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        id: string;
        organizationId: string;
        externalId: string;
        title: string | null;
        username: string | null;
        inviteLink: string | null;
        isActive: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        id: string;
        organizationId: string;
        externalId: string;
        title: string | null;
        username: string | null;
        inviteLink: string | null;
        isActive: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthUser, body: CreateChannelDto): Promise<{
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        id: string;
        organizationId: string;
        externalId: string;
        title: string | null;
        username: string | null;
        inviteLink: string | null;
        isActive: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthUser, id: string, body: UpdateChannelDto): Promise<{
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        id: string;
        organizationId: string;
        externalId: string;
        title: string | null;
        username: string | null;
        inviteLink: string | null;
        isActive: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAccesses(user: AuthUser, id: string): Promise<{
        status: import("@prisma/client").$Enums.AccessStatus;
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        subscriptionId: string;
        channelId: string;
        customerId: string;
        inviteId: string | null;
        discordRoleId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }[]>;
}
