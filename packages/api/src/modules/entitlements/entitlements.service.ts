import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateEntitlementDto, UpdateEntitlementDto } from './entitlements.schema';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    subscriptionId?: string;
    customerId?: string;
    entitlementKey?: string;
  }) {
    return this.prisma.entitlement.findMany({
      where: {
        subscriptionId: params?.subscriptionId,
        customerId: params?.customerId,
        entitlementKey: params?.entitlementKey,
      },
      include: {
        subscription: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const entitlement = await this.prisma.entitlement.findUnique({
      where: { id },
      include: {
        subscription: true,
        customer: true,
      },
    });

    if (!entitlement) {
      throw new NotFoundException(`Entitlement with ID ${id} not found`);
    }

    return entitlement;
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
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return !!entitlement;
  }

  async getActiveEntitlements(customerId: string) {
    return this.prisma.entitlement.findMany({
      where: {
        customerId,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        subscription: true,
      },
      orderBy: { grantedAt: 'desc' },
    });
  }
}
