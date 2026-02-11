import { PrismaService } from '../../prisma/prisma.service';
import type { CreateChannelDto, UpdateChannelDto, StartVerificationDto, VerifyChannelDto, VerifyDiscordChannelDto, SetDiscordRoleDto } from './channels.schema';
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
        type: import("@prisma/client").$Enums.ChannelType;
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
        type: import("@prisma/client").$Enums.ChannelType;
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
        type: import("@prisma/client").$Enums.ChannelType;
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
        type: import("@prisma/client").$Enums.ChannelType;
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
        discordRoleId: string | null;
        grantedAt: Date | null;
        revokedAt: Date | null;
        revokeReason: string | null;
    }[]>;
    startVerification(organizationId: string, dto: StartVerificationDto): Promise<{
        id: string;
        code: string;
        type: import("@prisma/client").$Enums.ChannelType;
        provider: import("@prisma/client").$Enums.ChannelProvider;
        expiresAt: Date;
    }>;
    checkVerificationStatus(verificationId: string, organizationId: string): Promise<{
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
    verifyFromBot(dto: VerifyChannelDto): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    verifyDiscordFromBot(dto: VerifyDiscordChannelDto): Promise<{
        success: boolean;
        message: string;
        guildId?: undefined;
    } | {
        success: boolean;
        guildId: string;
        message?: undefined;
    }>;
    setDiscordRole(verificationId: string, organizationId: string, dto: SetDiscordRoleDto): Promise<{
        success: boolean;
    }>;
    confirmDiscordVerification(verificationId: string, organizationId: string): Promise<{
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
    confirmVerification(verificationId: string, organizationId: string): Promise<{
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
    getDiscordGuild(channelId: string): Promise<{
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
    updateDiscordRole(channelId: string, dto: SetDiscordRoleDto): Promise<{
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
    findOneWithDiscord(id: string): Promise<{
        discordGuild: {
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
        } | null;
    } & {
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
}
