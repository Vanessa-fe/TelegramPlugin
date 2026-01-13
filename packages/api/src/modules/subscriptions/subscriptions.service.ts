import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import type { Subscription } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './subscriptions.schema';

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: {
    customer: true;
    plan: true;
    channelAccesses: true;
  };
}>;

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId?: string): Promise<SubscriptionWithRelations[]> {
    return this.prisma.subscription.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        plan: true,
        channelAccesses: true,
      },
    });
  }

  findOne(id: string): Promise<SubscriptionWithRelations> {
    return this.prisma.subscription.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        plan: true,
        channelAccesses: true,
      },
    });
  }

  create(data: CreateSubscriptionDto): Promise<Subscription> {
    const payload: Prisma.SubscriptionUncheckedCreateInput = {
      organizationId: data.organizationId,
      customerId: data.customerId,
      planId: data.planId,
      status: data.status ?? SubscriptionStatus.ACTIVE,
      externalId: data.externalId,
      externalCustomerId: data.externalCustomerId,
      externalPriceId: data.externalPriceId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: data.trialEndsAt,
      metadata: data.metadata,
    };

    return this.prisma.subscription.create({ data: payload });
  }

  update(id: string, data: UpdateSubscriptionDto): Promise<Subscription> {
    const payload: Prisma.SubscriptionUncheckedUpdateInput = {
      ...(data.organizationId && { organizationId: data.organizationId }),
      ...(data.customerId && { customerId: data.customerId }),
      ...(data.planId && { planId: data.planId }),
      ...(data.status && { status: data.status }),
      ...(data.externalId && { externalId: data.externalId }),
      ...(data.externalCustomerId && {
        externalCustomerId: data.externalCustomerId,
      }),
      ...(data.externalPriceId && { externalPriceId: data.externalPriceId }),
      ...(data.currentPeriodStart && {
        currentPeriodStart: data.currentPeriodStart,
      }),
      ...(data.currentPeriodEnd && { currentPeriodEnd: data.currentPeriodEnd }),
      ...(data.trialEndsAt && { trialEndsAt: data.trialEndsAt }),
      ...(data.canceledAt && { canceledAt: data.canceledAt }),
      ...(data.endedAt && { endedAt: data.endedAt }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    return this.prisma.subscription.update({
      where: { id },
      data: payload,
    });
  }
}
