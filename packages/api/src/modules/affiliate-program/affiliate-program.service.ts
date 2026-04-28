import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AffiliateProgramStatus,
  CommissionAppliesTo,
  Prisma,
} from '@prisma/client';
import type { AffiliateProgram } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateAffiliateProgramDto,
  UpdateAffiliateProgramDto,
} from './affiliate-program.schema';

export type AffiliateProgramWithStats = AffiliateProgram & {
  _count: { affiliates: number };
  totalClicks: number;
  totalConversions: number;
  totalCommissions: number;
};

@Injectable()
export class AffiliateProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    organizationId: string,
  ): Promise<AffiliateProgramWithStats | null> {
    const program = await this.prisma.affiliateProgram.findUnique({
      where: { organizationId },
    });

    if (!program) {
      return null;
    }

    const stats = await this.getStats(organizationId);

    return {
      ...program,
      _count: { affiliates: stats.affiliatesCount },
      totalClicks: stats.totalClicks,
      totalConversions: stats.totalConversions,
      totalCommissions: stats.totalCommissions,
    };
  }

  async create(data: CreateAffiliateProgramDto): Promise<AffiliateProgram> {
    const existing = await this.prisma.affiliateProgram.findUnique({
      where: { organizationId: data.organizationId },
    });

    if (existing) {
      throw new BadRequestException(
        "Un programme d'affiliation existe déjà pour cette organisation",
      );
    }

    if (
      data.appliesTo === CommissionAppliesTo.SPECIFIC_PRODUCTS &&
      (!data.productIds || data.productIds.length === 0)
    ) {
      throw new BadRequestException(
        "Vous devez sélectionner au moins un produit quand le programme s'applique à des produits spécifiques",
      );
    }

    if (data.productIds && data.productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: data.productIds },
          organizationId: data.organizationId,
        },
      });

      if (products.length !== data.productIds.length) {
        throw new BadRequestException(
          'Certains produits sélectionnés sont invalides',
        );
      }
    }

    const payload: Prisma.AffiliateProgramCreateInput = {
      name: data.name,
      commissionValue: data.commissionValue,
      attributionWindowDays: data.attributionWindowDays,
      validationDelayDays: data.validationDelayDays,
      appliesTo: data.appliesTo,
      productIds: data.productIds ?? [],
      status: data.status,
      organization: {
        connect: { id: data.organizationId },
      },
    };

    return this.prisma.affiliateProgram.create({ data: payload });
  }

  async update(
    organizationId: string,
    data: UpdateAffiliateProgramDto,
  ): Promise<AffiliateProgram> {
    const existing = await this.prisma.affiliateProgram.findUnique({
      where: { organizationId },
    });

    if (!existing) {
      throw new NotFoundException(
        "Programme d'affiliation introuvable. Créez-en un d'abord.",
      );
    }

    const appliesTo = data.appliesTo ?? existing.appliesTo;
    const productIds = data.productIds ?? existing.productIds;

    if (
      appliesTo === CommissionAppliesTo.SPECIFIC_PRODUCTS &&
      productIds.length === 0
    ) {
      throw new BadRequestException(
        "Vous devez sélectionner au moins un produit quand le programme s'applique à des produits spécifiques",
      );
    }

    if (data.productIds && data.productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: data.productIds },
          organizationId,
        },
      });

      if (products.length !== data.productIds.length) {
        throw new BadRequestException(
          'Certains produits sélectionnés sont invalides',
        );
      }
    }

    const payload: Prisma.AffiliateProgramUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.commissionValue !== undefined && {
        commissionValue: data.commissionValue,
      }),
      ...(data.attributionWindowDays !== undefined && {
        attributionWindowDays: data.attributionWindowDays,
      }),
      ...(data.validationDelayDays !== undefined && {
        validationDelayDays: data.validationDelayDays,
      }),
      ...(data.appliesTo !== undefined && { appliesTo: data.appliesTo }),
      ...(data.productIds !== undefined && { productIds: data.productIds }),
      ...(data.status !== undefined && { status: data.status }),
    };

    return this.prisma.affiliateProgram.update({
      where: { organizationId },
      data: payload,
    });
  }

  async getStats(organizationId: string): Promise<{
    affiliatesCount: number;
    totalClicks: number;
    totalConversions: number;
    totalCommissions: number;
    pendingCommissions: number;
    approvedCommissions: number;
    paidCommissions: number;
  }> {
    const [affiliatesCount, clicksAgg, referralsAgg] = await Promise.all([
      this.prisma.affiliate.count({
        where: { organizationId },
      }),
      this.prisma.affiliateClick.aggregate({
        where: {
          affiliate: {
            organizationId,
          },
        },
        _count: true,
      }),
      this.prisma.affiliateReferral.groupBy({
        by: ['status'],
        where: {
          affiliate: {
            organizationId,
          },
        },
        _count: true,
        _sum: {
          commissionCents: true,
        },
      }),
    ]);

    let totalConversions = 0;
    let totalCommissions = 0;
    let pendingCommissions = 0;
    let approvedCommissions = 0;
    let paidCommissions = 0;

    for (const group of referralsAgg) {
      totalConversions += group._count;
      totalCommissions += group._sum.commissionCents ?? 0;

      switch (group.status) {
        case 'PENDING':
          pendingCommissions += group._sum.commissionCents ?? 0;
          break;
        case 'APPROVED':
          approvedCommissions += group._sum.commissionCents ?? 0;
          break;
        case 'PAID':
          paidCommissions += group._sum.commissionCents ?? 0;
          break;
      }
    }

    return {
      affiliatesCount,
      totalClicks: clicksAgg._count,
      totalConversions,
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
    };
  }

  async isProductEligible(
    organizationId: string,
    productId: string,
  ): Promise<boolean> {
    const program = await this.prisma.affiliateProgram.findUnique({
      where: { organizationId },
    });

    if (!program || program.status !== AffiliateProgramStatus.ACTIVE) {
      return false;
    }

    if (program.appliesTo === CommissionAppliesTo.ALL_PRODUCTS) {
      return true;
    }

    return program.productIds.includes(productId);
  }
}
