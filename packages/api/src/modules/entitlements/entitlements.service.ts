import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, EntitlementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateEntitlementDto,
  UpdateEntitlementDto,
} from './entitlements.schema';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    subscriptionId?: string;
    customerId?: string;
    entitlementKey?: string;
  }) {
    const entitlements = await this.prisma.entitlement.findMany({
      where: {
        subscriptionId: params?.subscriptionId,
        customerId: params?.customerId,
        entitlementKey: params?.entitlementKey,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract channel IDs from CHANNEL_ACCESS entitlements
    const channelIds = entitlements
      .filter(
        (e) => e.type === ('CHANNEL_ACCESS' as EntitlementType) && e.resourceId,
      )
      .map((e) => e.resourceId as string);

    // Fetch channels if any
    const channels =
      channelIds.length > 0
        ? await this.prisma.channel.findMany({
            where: { id: { in: channelIds } },
            select: { id: true, title: true, username: true },
          })
        : [];

    const channelMap = new Map(channels.map((c) => [c.id, c]));

    // Enrich entitlements with channel info
    return entitlements.map((entitlement) => ({
      ...entitlement,
      channel:
        entitlement.type === ('CHANNEL_ACCESS' as EntitlementType) &&
        entitlement.resourceId
          ? channelMap.get(entitlement.resourceId) || null
          : null,
    }));
  }

  async findOne(id: string) {
    const entitlement = await this.prisma.entitlement.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        customer: true,
      },
    });

    if (!entitlement) {
      throw new NotFoundException(`Entitlement with ID ${id} not found`);
    }

    // If CHANNEL_ACCESS, fetch the channel
    let channel: { id: string; title: string | null; username: string | null } | null = null;
    if (
      entitlement.type === ('CHANNEL_ACCESS' as EntitlementType) &&
      entitlement.resourceId
    ) {
      channel = await this.prisma.channel.findUnique({
        where: { id: entitlement.resourceId },
        select: { id: true, title: true, username: true },
      });
    }

    return { ...entitlement, channel };
  }

  async create(dto: CreateEntitlementDto) {
    return this.prisma.entitlement.create({
      data: {
        subscriptionId: dto.subscriptionId,
        customerId: dto.customerId,
        entitlementKey: dto.entitlementKey,
        type: dto.type,
        resourceId: dto.resourceId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
      include: {
        subscription: true,
        customer: true,
      },
    });
  }

  async update(id: string, dto: UpdateEntitlementDto) {
    return this.prisma.entitlement.update({
      where: { id },
      data: {
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        revokedAt: dto.revokedAt ? new Date(dto.revokedAt) : undefined,
        revokeReason: dto.revokeReason,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
      include: {
        subscription: true,
        customer: true,
      },
    });
  }

  async revoke(id: string, reason: string) {
    return this.prisma.entitlement.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  async checkEntitlement(
    customerId: string,
    entitlementKey: string,
  ): Promise<boolean> {
    const entitlement = await this.prisma.entitlement.findFirst({
      where: {
        customerId,
        entitlementKey,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return !!entitlement;
  }

  async getActiveEntitlements(customerId: string) {
    return this.prisma.entitlement.findMany({
      where: {
        customerId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        subscription: true,
      },
      orderBy: { grantedAt: 'desc' },
    });
  }
}
