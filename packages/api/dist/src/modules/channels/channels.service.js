"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const nanoid_1 = require("nanoid");
const generateCode = (0, nanoid_1.customAlphabet)('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
let ChannelsService = class ChannelsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId) {
        return this.prisma.channel.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const channel = await this.prisma.channel.findUnique({
            where: { id },
        });
        if (!channel) {
            throw new common_1.NotFoundException(`Channel with ID ${id} not found`);
        }
        return channel;
    }
    async create(dto) {
        return this.prisma.channel.create({
            data: dto,
        });
    }
    async update(id, dto) {
        return this.prisma.channel.update({
            where: { id },
            data: dto,
        });
    }
    async getAccesses(channelId) {
        return this.prisma.channelAccess.findMany({
            where: { channelId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async startVerification(organizationId, dto) {
        const provider = dto.provider ?? client_1.ChannelProvider.TELEGRAM;
        const prefix = provider === client_1.ChannelProvider.DISCORD ? 'DISCORD' : 'TGPLUGIN';
        const code = `${prefix}-${generateCode()}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const verification = await this.prisma.channelVerification.create({
            data: {
                organizationId,
                provider,
                code,
                type: dto.type,
                expiresAt,
            },
        });
        return {
            id: verification.id,
            code: verification.code,
            type: verification.type,
            provider: verification.provider,
            expiresAt: verification.expiresAt,
        };
    }
    async checkVerificationStatus(verificationId, organizationId) {
        const verification = await this.prisma.channelVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.status === client_1.VerificationStatus.PENDING &&
            verification.expiresAt < new Date()) {
            await this.prisma.channelVerification.update({
                where: { id: verificationId },
                data: { status: client_1.VerificationStatus.EXPIRED },
            });
            return { status: client_1.VerificationStatus.EXPIRED, provider: verification.provider };
        }
        return {
            status: verification.status,
            provider: verification.provider,
            type: verification.type,
            telegramChatId: verification.telegramChatId,
            telegramTitle: verification.telegramTitle,
            telegramUsername: verification.telegramUsername,
            discordGuildId: verification.discordGuildId,
            discordGuildName: verification.discordGuildName,
            discordRoleId: verification.discordRoleId,
            discordRoleName: verification.discordRoleName,
        };
    }
    async verifyFromBot(dto) {
        const code = dto.code.toUpperCase();
        const verification = await this.prisma.channelVerification.findUnique({
            where: { code },
        });
        if (!verification) {
            return { success: false, message: 'Verification code not found' };
        }
        if (verification.provider !== client_1.ChannelProvider.TELEGRAM) {
            return { success: false, message: 'Invalid provider for this code' };
        }
        if (verification.status !== client_1.VerificationStatus.PENDING) {
            return { success: false, message: 'Verification already processed' };
        }
        if (verification.expiresAt < new Date()) {
            await this.prisma.channelVerification.update({
                where: { id: verification.id },
                data: { status: client_1.VerificationStatus.EXPIRED },
            });
            return { success: false, message: 'Verification code expired' };
        }
        await this.prisma.channelVerification.update({
            where: { id: verification.id },
            data: {
                status: client_1.VerificationStatus.VERIFIED,
                telegramChatId: dto.telegramChatId,
                telegramTitle: dto.telegramTitle,
                telegramUsername: dto.telegramUsername,
                verifiedAt: new Date(),
            },
        });
        return { success: true };
    }
    async verifyDiscordFromBot(dto) {
        const code = dto.code.toUpperCase();
        const verification = await this.prisma.channelVerification.findUnique({
            where: { code },
        });
        if (!verification) {
            return { success: false, message: 'Verification code not found' };
        }
        if (verification.provider !== client_1.ChannelProvider.DISCORD) {
            return { success: false, message: 'Invalid provider for this code' };
        }
        if (verification.status !== client_1.VerificationStatus.PENDING) {
            return { success: false, message: 'Verification already processed' };
        }
        if (verification.expiresAt < new Date()) {
            await this.prisma.channelVerification.update({
                where: { id: verification.id },
                data: { status: client_1.VerificationStatus.EXPIRED },
            });
            return { success: false, message: 'Verification code expired' };
        }
        await this.prisma.channelVerification.update({
            where: { id: verification.id },
            data: {
                status: client_1.VerificationStatus.VERIFIED,
                discordGuildId: dto.discordGuildId,
                discordGuildName: dto.discordGuildName,
                verifiedAt: new Date(),
            },
        });
        return { success: true, guildId: dto.discordGuildId };
    }
    async setDiscordRole(verificationId, organizationId, dto) {
        const verification = await this.prisma.channelVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.provider !== client_1.ChannelProvider.DISCORD) {
            throw new common_1.BadRequestException('This verification is not for Discord');
        }
        if (verification.status !== client_1.VerificationStatus.VERIFIED) {
            throw new common_1.BadRequestException('Verification not completed. Please add the bot to your Discord server first.');
        }
        await this.prisma.channelVerification.update({
            where: { id: verificationId },
            data: {
                discordRoleId: dto.roleId,
                discordRoleName: dto.roleName,
            },
        });
        return { success: true };
    }
    async confirmDiscordVerification(verificationId, organizationId) {
        const verification = await this.prisma.channelVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.provider !== client_1.ChannelProvider.DISCORD) {
            throw new common_1.BadRequestException('This verification is not for Discord');
        }
        if (verification.status !== client_1.VerificationStatus.VERIFIED) {
            throw new common_1.BadRequestException('Verification not completed. Please add the bot to your Discord server first.');
        }
        if (!verification.discordGuildId) {
            throw new common_1.BadRequestException('Discord guild ID not found');
        }
        if (!verification.discordRoleId) {
            throw new common_1.BadRequestException('Please select a role for paid access before confirming.');
        }
        const existingChannel = await this.prisma.channel.findUnique({
            where: {
                organizationId_provider_externalId: {
                    organizationId,
                    provider: client_1.ChannelProvider.DISCORD,
                    externalId: verification.discordGuildId,
                },
            },
        });
        if (existingChannel) {
            throw new common_1.ConflictException('This Discord server is already connected');
        }
        const channel = await this.prisma.$transaction(async (tx) => {
            const newChannel = await tx.channel.create({
                data: {
                    organizationId,
                    provider: client_1.ChannelProvider.DISCORD,
                    type: client_1.ChannelType.GROUP,
                    externalId: verification.discordGuildId,
                    title: verification.discordGuildName,
                    isActive: true,
                    metadata: {
                        verifiedAt: verification.verifiedAt,
                    },
                },
            });
            await tx.discordGuild.create({
                data: {
                    channelId: newChannel.id,
                    guildId: verification.discordGuildId,
                    guildName: verification.discordGuildName,
                    roleId: verification.discordRoleId,
                    roleName: verification.discordRoleName,
                    botJoinedAt: verification.verifiedAt,
                },
            });
            return newChannel;
        });
        await this.prisma.channelVerification.update({
            where: { id: verificationId },
            data: { status: client_1.VerificationStatus.USED },
        });
        return channel;
    }
    async confirmVerification(verificationId, organizationId) {
        const verification = await this.prisma.channelVerification.findUnique({
            where: { id: verificationId },
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Verification not found');
        }
        if (verification.status !== client_1.VerificationStatus.VERIFIED) {
            throw new common_1.BadRequestException('Verification not completed. Please post the code in your Telegram channel first.');
        }
        if (!verification.telegramChatId) {
            throw new common_1.BadRequestException('Telegram chat ID not found');
        }
        const existingChannel = await this.prisma.channel.findUnique({
            where: {
                organizationId_provider_externalId: {
                    organizationId,
                    provider: client_1.ChannelProvider.TELEGRAM,
                    externalId: verification.telegramChatId,
                },
            },
        });
        if (existingChannel) {
            throw new common_1.ConflictException('This Telegram channel is already connected');
        }
        const channel = await this.prisma.channel.create({
            data: {
                organizationId,
                provider: client_1.ChannelProvider.TELEGRAM,
                type: verification.type,
                externalId: verification.telegramChatId,
                title: verification.telegramTitle,
                username: verification.telegramUsername,
                isActive: true,
                metadata: {
                    verifiedAt: verification.verifiedAt,
                },
            },
        });
        await this.prisma.channelVerification.update({
            where: { id: verificationId },
            data: { status: client_1.VerificationStatus.USED },
        });
        return channel;
    }
    async getDiscordGuild(channelId) {
        const discordGuild = await this.prisma.discordGuild.findUnique({
            where: { channelId },
            include: { channel: true },
        });
        if (!discordGuild) {
            throw new common_1.NotFoundException('Discord guild not found for this channel');
        }
        return discordGuild;
    }
    async updateDiscordRole(channelId, dto) {
        const discordGuild = await this.prisma.discordGuild.findUnique({
            where: { channelId },
        });
        if (!discordGuild) {
            throw new common_1.NotFoundException('Discord guild not found for this channel');
        }
        return this.prisma.discordGuild.update({
            where: { channelId },
            data: {
                roleId: dto.roleId,
                roleName: dto.roleName,
            },
        });
    }
    async findOneWithDiscord(id) {
        const channel = await this.prisma.channel.findUnique({
            where: { id },
            include: {
                discordGuild: true,
            },
        });
        if (!channel) {
            throw new common_1.NotFoundException(`Channel with ID ${id} not found`);
        }
        return channel;
    }
};
exports.ChannelsService = ChannelsService;
exports.ChannelsService = ChannelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChannelsService);
//# sourceMappingURL=channels.service.js.map