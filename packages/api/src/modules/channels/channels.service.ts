import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateChannelDto, UpdateChannelDto } from './channels.schema';

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
}
