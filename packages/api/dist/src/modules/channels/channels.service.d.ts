import { PrismaService } from '../../prisma/prisma.service';
import type { CreateChannelDto, UpdateChannelDto, StartVerificationDto, VerifyChannelDto, VerifyDiscordChannelDto, SetDiscordRoleDto } from './channels.schema';
export declare class ChannelsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string): Promise<{
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
    findOne(id: string): Promise<{
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
    create(dto: CreateChannelDto): Promise<{
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
    update(id: string, dto: UpdateChannelDto): Promise<{
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
    getAccesses(channelId: string): Promise<{
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
    confirmVerification(verificationId: string, organizationId: string): Promise<{
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
    getDiscordGuild(channelId: string): Promise<{
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
    updateDiscordRole(channelId: string, dto: SetDiscordRoleDto): Promise<{
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
    findOneWithDiscord(id: string): Promise<{
        discordGuild: {
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
        } | null;
    } & {
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
}
