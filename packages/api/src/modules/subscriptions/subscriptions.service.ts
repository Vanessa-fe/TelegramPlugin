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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueSlug(
    organizationId: string,
    customerName: string,
  ): Promise<string> {
    const baseSlug = slugify(customerName || 'subscriber');

    // Check if slug exists
    let slug = baseSlug;
    let counter = 1;
    let existing = await this.prisma.subscription.findFirst({
      where: { organizationId, slug },
    });

    while (existing) {
      counter++;
      slug = `${baseSlug}-${counter}`;
      existing = await this.prisma.subscription.findFirst({
        where: { organizationId, slug },
      });
    }

    return slug;
  }

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

  findBySlug(
    organizationId: string,
    slug: string,
  ): Promise<SubscriptionWithRelations | null> {
    return this.prisma.subscription.findFirst({
      where: { organizationId, slug },
      include: {
        customer: true,
        plan: true,
        channelAccesses: true,
      },
    });
  }

  async create(data: CreateSubscriptionDto): Promise<Subscription> {
    // Get customer name for slug generation
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { displayName: true, email: true },
    });

    const customerName =
      customer?.displayName || customer?.email?.split('@')[0] || 'subscriber';
    const slug = await this.generateUniqueSlug(
      data.organizationId,
      customerName,
    );

    const payload: Prisma.SubscriptionUncheckedCreateInput = {
      organizationId: data.organizationId,
      customerId: data.customerId,
      planId: data.planId,
      slug,
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

  async backfillSlugs(): Promise<number> {
    // Find all subscriptions without slugs
    const subscriptionsWithoutSlug = await this.prisma.subscription.findMany({
      where: { slug: null },
      include: { customer: true },
    });

    let updatedCount = 0;
    for (const subscription of subscriptionsWithoutSlug) {
      const customerName =
        subscription.customer?.displayName ||
        subscription.customer?.email?.split('@')[0] ||
        'subscriber';
      const slug = await this.generateUniqueSlug(
        subscription.organizationId,
        customerName,
      );

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { slug },
      });
      updatedCount++;
    }

    return updatedCount;
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
