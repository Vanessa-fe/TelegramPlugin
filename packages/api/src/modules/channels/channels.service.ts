import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ChannelType,
  VerificationStatus,
  ChannelProvider,
} from '@prisma/client';
import type {
  CreateChannelDto,
  UpdateChannelDto,
  StartVerificationDto,
  VerifyChannelDto,
  VerifyDiscordChannelDto,
  SetDiscordRoleDto,
} from './channels.schema';

const VERIFICATION_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (const byte of bytes) {
    code +=
      VERIFICATION_CODE_ALPHABET[byte % VERIFICATION_CODE_ALPHABET.length];
  }
  return code;
}

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.channel.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }

    return channel;
  }

  async create(dto: CreateChannelDto) {
    return this.prisma.channel.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateChannelDto) {
    return this.prisma.channel.update({
      where: { id },
      data: dto,
    });
  }

  async getAccesses(channelId: string) {
    return this.prisma.channelAccess.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========== Verification Methods ==========

  async startVerification(organizationId: string, dto: StartVerificationDto) {
    const provider = dto.provider ?? ChannelProvider.TELEGRAM;
    const prefix =
      provider === ChannelProvider.DISCORD ? 'DISCORD' : 'TGPLUGIN';
    const code = `${prefix}-${generateCode()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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

  async checkVerificationStatus(
    verificationId: string,
    organizationId: string,
  ) {
    const verification = await this.prisma.channelVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.organizationId !== organizationId) {
      throw new NotFoundException('Verification not found');
    }

    // Check if expired
    if (
      verification.status === VerificationStatus.PENDING &&
      verification.expiresAt < new Date()
    ) {
      await this.prisma.channelVerification.update({
        where: { id: verificationId },
        data: { status: VerificationStatus.EXPIRED },
      });
      return {
        status: VerificationStatus.EXPIRED,
        provider: verification.provider,
      };
    }

    return {
      status: verification.status,
      provider: verification.provider,
      type: verification.type,
      // Telegram fields
      telegramChatId: verification.telegramChatId,
      telegramTitle: verification.telegramTitle,
      telegramUsername: verification.telegramUsername,
      // Discord fields
      discordGuildId: verification.discordGuildId,
      discordGuildName: verification.discordGuildName,
      discordRoleId: verification.discordRoleId,
      discordRoleName: verification.discordRoleName,
    };
  }

  async verifyFromBot(dto: VerifyChannelDto) {
    const code = dto.code.toUpperCase();

    const verification = await this.prisma.channelVerification.findUnique({
      where: { code },
    });

    if (!verification) {
      return { success: false, message: 'Verification code not found' };
    }

    if (verification.provider !== ChannelProvider.TELEGRAM) {
      return { success: false, message: 'Invalid provider for this code' };
    }

    if (verification.status !== VerificationStatus.PENDING) {
      return { success: false, message: 'Verification already processed' };
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.channelVerification.update({
        where: { id: verification.id },
        data: { status: VerificationStatus.EXPIRED },
      });
      return { success: false, message: 'Verification code expired' };
    }

    // Update verification with Telegram info
    await this.prisma.channelVerification.update({
      where: { id: verification.id },
      data: {
        status: VerificationStatus.VERIFIED,
        telegramChatId: dto.telegramChatId,
        telegramTitle: dto.telegramTitle,
        telegramUsername: dto.telegramUsername,
        verifiedAt: new Date(),
      },
    });

    return { success: true };
  }

  // ========== Discord Verification Methods ==========

  async verifyDiscordFromBot(dto: VerifyDiscordChannelDto) {
    const code = dto.code.toUpperCase();

    const verification = await this.prisma.channelVerification.findUnique({
      where: { code },
    });

    if (!verification) {
      return { success: false, message: 'Verification code not found' };
    }

    if (verification.provider !== ChannelProvider.DISCORD) {
      return { success: false, message: 'Invalid provider for this code' };
    }

    if (verification.status !== VerificationStatus.PENDING) {
      return { success: false, message: 'Verification already processed' };
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.channelVerification.update({
        where: { id: verification.id },
        data: { status: VerificationStatus.EXPIRED },
      });
      return { success: false, message: 'Verification code expired' };
    }

    // Update verification with Discord info
    await this.prisma.channelVerification.update({
      where: { id: verification.id },
      data: {
        status: VerificationStatus.VERIFIED,
        discordGuildId: dto.discordGuildId,
        discordGuildName: dto.discordGuildName,
        verifiedAt: new Date(),
      },
    });

    return { success: true, guildId: dto.discordGuildId };
  }

  async setDiscordRole(
    verificationId: string,
    organizationId: string,
    dto: SetDiscordRoleDto,
  ) {
    const verification = await this.prisma.channelVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.organizationId !== organizationId) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.provider !== ChannelProvider.DISCORD) {
      throw new BadRequestException('This verification is not for Discord');
    }

    if (verification.status !== VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'Verification not completed. Please add the bot to your Discord server first.',
      );
    }

    // Update the role selection
    await this.prisma.channelVerification.update({
      where: { id: verificationId },
      data: {
        discordRoleId: dto.roleId,
        discordRoleName: dto.roleName,
      },
    });

    return { success: true };
  }

  async confirmDiscordVerification(
    verificationId: string,
    organizationId: string,
  ) {
    const verification = await this.prisma.channelVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.organizationId !== organizationId) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.provider !== ChannelProvider.DISCORD) {
      throw new BadRequestException('This verification is not for Discord');
    }

    if (verification.status !== VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'Verification not completed. Please add the bot to your Discord server first.',
      );
    }

    if (!verification.discordGuildId) {
      throw new BadRequestException('Discord guild ID not found');
    }

    if (!verification.discordRoleId) {
      throw new BadRequestException(
        'Please select a role for paid access before confirming.',
      );
    }

    // Check if channel already exists
    const existingChannel = await this.prisma.channel.findUnique({
      where: {
        organizationId_provider_externalId: {
          organizationId,
          provider: ChannelProvider.DISCORD,
          externalId: verification.discordGuildId,
        },
      },
    });

    if (existingChannel) {
      throw new ConflictException('This Discord server is already connected');
    }

    // Create the channel with Discord guild info
    const channel = await this.prisma.$transaction(async (tx) => {
      const newChannel = await tx.channel.create({
        data: {
          organizationId,
          provider: ChannelProvider.DISCORD,
          type: ChannelType.GROUP, // Discord servers are similar to groups
          externalId: verification.discordGuildId!,
          title: verification.discordGuildName,
          isActive: true,
          metadata: {
            verifiedAt: verification.verifiedAt,
          },
        },
      });

      // Create Discord guild record
      await tx.discordGuild.create({
        data: {
          channelId: newChannel.id,
          guildId: verification.discordGuildId!,
          guildName: verification.discordGuildName,
          roleId: verification.discordRoleId,
          roleName: verification.discordRoleName,
          botJoinedAt: verification.verifiedAt,
        },
      });

      return newChannel;
    });

    // Mark verification as used
    await this.prisma.channelVerification.update({
      where: { id: verificationId },
      data: { status: VerificationStatus.USED },
    });

    return channel;
  }

  async confirmVerification(verificationId: string, organizationId: string) {
    const verification = await this.prisma.channelVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.organizationId !== organizationId) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.status !== VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'Verification not completed. Please post the code in your Telegram channel first.',
      );
    }

    if (!verification.telegramChatId) {
      throw new BadRequestException('Telegram chat ID not found');
    }

    // Check if channel already exists
    const existingChannel = await this.prisma.channel.findUnique({
      where: {
        organizationId_provider_externalId: {
          organizationId,
          provider: ChannelProvider.TELEGRAM,
          externalId: verification.telegramChatId,
        },
      },
    });

    if (existingChannel) {
      throw new ConflictException('This Telegram channel is already connected');
    }

    // Create the channel
    const channel = await this.prisma.channel.create({
      data: {
        organizationId,
        provider: ChannelProvider.TELEGRAM,
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

    // Mark verification as used
    await this.prisma.channelVerification.update({
      where: { id: verificationId },
      data: { status: VerificationStatus.USED },
    });

    return channel;
  }

  // ========== Discord Guild Methods ==========

  async getDiscordGuild(channelId: string) {
    const discordGuild = await this.prisma.discordGuild.findUnique({
      where: { channelId },
      include: { channel: true },
    });

    if (!discordGuild) {
      throw new NotFoundException('Discord guild not found for this channel');
    }

    return discordGuild;
  }

  async updateDiscordRole(channelId: string, dto: SetDiscordRoleDto) {
    const discordGuild = await this.prisma.discordGuild.findUnique({
      where: { channelId },
    });

    if (!discordGuild) {
      throw new NotFoundException('Discord guild not found for this channel');
    }

    return this.prisma.discordGuild.update({
      where: { channelId },
      data: {
        roleId: dto.roleId,
        roleName: dto.roleName,
      },
    });
  }

  async findOneWithDiscord(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: {
        discordGuild: true,
      },
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }

    return channel;
  }
}
