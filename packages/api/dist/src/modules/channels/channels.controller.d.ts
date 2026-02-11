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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        externalId: string;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        type: import("@prisma/client").$Enums.ChannelType;
        inviteLink: string | null;
        title: string | null;
        username: string | null;
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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        externalId: string;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        type: import("@prisma/client").$Enums.ChannelType;
        inviteLink: string | null;
        title: string | null;
        username: string | null;
    }>;
    getDiscordGuild(user: AuthUser, id: string): Promise<{
        channel: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
        status: import("@prisma/client").$Enums.InviteStatus;
        channelId: string;
        roleId: string | null;
        roleName: string | null;
        guildId: string;
        guildName: string | null;
        botJoinedAt: Date | null;
    }>;
    updateDiscordRole(user: AuthUser, id: string, body: SetDiscordRoleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InviteStatus;
        channelId: string;
        roleId: string | null;
        roleName: string | null;
        guildId: string;
        guildName: string | null;
        botJoinedAt: Date | null;
    }>;
    findAll(user: AuthUser, organizationId?: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        externalId: string;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        type: import("@prisma/client").$Enums.ChannelType;
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
        type: import("@prisma/client").$Enums.ChannelType;
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
        type: import("@prisma/client").$Enums.ChannelType;
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
        type: import("@prisma/client").$Enums.ChannelType;
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
        discordRoleId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }[]>;
}
