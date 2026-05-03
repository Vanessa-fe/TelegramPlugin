import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanInterval, Prisma } from '@prisma/client';
import type { Plan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePlanDto, UpdatePlanDto } from './plans.schema';

type PlanWithRelations = Prisma.PlanGetPayload<{
  include: {
    product: true;
    subscriptions: true;
  };
}>;

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: {
    productId?: string;
    organizationId?: string;
    includeInactive?: boolean;
  }): Promise<PlanWithRelations[]> {
    const where: Prisma.PlanWhereInput = {};

    if (params.productId) {
      where.productId = params.productId;
    }

    if (params.organizationId) {
      where.product = { organizationId: params.organizationId };
    }

    if (!params.includeInactive) {
      where.isActive = true;
    }

    return this.prisma.plan.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        product: true,
        subscriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string): Promise<PlanWithRelations> {
    return this.prisma.plan.findUniqueOrThrow({
      where: { id },
      include: {
        product: true,
        subscriptions: true,
      },
    });
  }

  async create(data: CreatePlanDto): Promise<Plan> {
    const organizationCurrency = await this.getProductOrganizationCurrency(
      data.productId,
    );

    if (!organizationCurrency) {
      throw new BadRequestException('Organisation introuvable pour ce produit');
    }

    if (data.currency !== organizationCurrency) {
      throw new BadRequestException(
        `La devise doit correspondre à celle de l'organisation (${organizationCurrency})`,
      );
    }

    const payload: Prisma.PlanCreateInput = {
      name: data.name.trim(),
      description: data.description,
      interval: data.interval,
      priceCents: data.priceCents,
      currency: data.currency,
      trialPeriodDays:
        data.interval === PlanInterval.ONE_TIME
          ? undefined
          : data.trialPeriodDays,
      accessDurationDays:
        data.interval === PlanInterval.ONE_TIME
          ? data.accessDurationDays
          : undefined,
      isActive: data.isActive ?? true,
      metadata: data.metadata,
      product: {
        connect: { id: data.productId },
      },
    };

    return this.prisma.plan.create({ data: payload });
  }

  async update(id: string, data: UpdatePlanDto): Promise<Plan> {
    const existingPlan = await this.prisma.plan.findUnique({
      where: { id },
      select: {
        productId: true,
        currency: true,
        interval: true,
      },
    });

    if (!existingPlan) {
      throw new NotFoundException('Plan introuvable');
    }

    const targetProductId = data.productId ?? existingPlan.productId;
    const targetCurrency = data.currency ?? existingPlan.currency;
    const organizationCurrency =
      await this.getProductOrganizationCurrency(targetProductId);

    if (!organizationCurrency) {
      throw new BadRequestException('Organisation introuvable pour ce produit');
    }

    if (targetCurrency !== organizationCurrency) {
      throw new BadRequestException(
        `La devise doit correspondre à celle de l'organisation (${organizationCurrency})`,
      );
    }

    const targetInterval = data.interval ?? existingPlan.interval;
    const payload: Prisma.PlanUpdateInput = {
      ...(data.productId && {
        product: { connect: { id: data.productId } },
      }),
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.interval !== undefined && { interval: data.interval }),
      ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    if (targetInterval === PlanInterval.ONE_TIME) {
      payload.trialPeriodDays = null;
      if (data.accessDurationDays !== undefined) {
        payload.accessDurationDays = data.accessDurationDays;
      }
    } else {
      payload.accessDurationDays = null;
      if (data.trialPeriodDays !== undefined) {
        payload.trialPeriodDays = data.trialPeriodDays;
      }
    }

    return this.prisma.plan.update({
      where: { id },
      data: payload,
    });
  }

  async getProductOrganization(productId: string): Promise<string | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { organizationId: true },
    });

    return product?.organizationId ?? null;
  }

  private async getProductOrganizationCurrency(
    productId: string,
  ): Promise<string | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        organization: {
          select: { currency: true },
        },
      },
    });

    return product?.organization.currency ?? null;
  }
}
