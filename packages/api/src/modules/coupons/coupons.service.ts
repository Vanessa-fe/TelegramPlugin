import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CouponStatus, CouponType, Prisma } from '@prisma/client';
import type { Coupon } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './coupons.schema';

export type CouponWithUsageStats = Coupon & {
  _count: { usages: number };
};

export type ValidateCouponResult = {
  valid: boolean;
  coupon?: Coupon;
  discountCents?: number;
  discountPercentage?: number;
  error?: string;
};

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCouponDto): Promise<Coupon> {
    const organizationCurrency = await this.getOrganizationCurrency(
      data.organizationId,
    );

    const existing = await this.prisma.coupon.findUnique({
      where: {
        organizationId_code: {
          organizationId: data.organizationId,
          code: data.code,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Un coupon avec ce code existe déjà');
    }

    if (data.type === CouponType.FIXED_AMOUNT) {
      if (data.currency !== organizationCurrency) {
        throw new BadRequestException(
          `La devise du coupon doit correspondre à celle de l'organisation (${organizationCurrency})`,
        );
      }
    } else if (data.currency) {
      throw new BadRequestException(
        'La devise doit être vide pour un coupon en pourcentage',
      );
    }

    const payload: Prisma.CouponCreateInput = {
      code: data.code,
      type: data.type,
      discountValue: data.discountValue,
      currency:
        data.type === CouponType.FIXED_AMOUNT ? organizationCurrency : undefined,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      planIds: data.planIds,
      organization: {
        connect: { id: data.organizationId },
      },
    };

    return this.prisma.coupon.create({ data: payload });
  }

  async findAll(organizationId: string): Promise<CouponWithUsageStats[]> {
    return this.prisma.coupon.findMany({
      where: { organizationId },
      include: {
        _count: { select: { usages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<CouponWithUsageStats> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon introuvable');
    }

    return coupon;
  }

  async update(id: string, data: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    const organizationCurrency = await this.getOrganizationCurrency(
      coupon.organizationId,
    );

    if (data.code && data.code !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: {
          organizationId_code: {
            organizationId: coupon.organizationId,
            code: data.code,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('Un coupon avec ce code existe déjà');
      }
    }

    if (coupon.type === CouponType.FIXED_AMOUNT && data.currency) {
      if (data.currency !== organizationCurrency) {
        throw new BadRequestException(
          `La devise du coupon doit correspondre à celle de l'organisation (${organizationCurrency})`,
        );
      }
    }

    if (coupon.type === CouponType.PERCENTAGE && data.currency !== undefined) {
      throw new BadRequestException(
        'La devise ne peut pas être modifiée pour un coupon en pourcentage',
      );
    }

    const payload: Prisma.CouponUpdateInput = {
      ...(data.code && { code: data.code }),
      ...(data.discountValue !== undefined && {
        discountValue: data.discountValue,
      }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.status && { status: data.status }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      ...(data.planIds && { planIds: data.planIds }),
    };

    return this.prisma.coupon.update({
      where: { id },
      data: payload,
    });
  }

  async disable(id: string): Promise<Coupon> {
    await this.findOne(id);

    return this.prisma.coupon.update({
      where: { id },
      data: { status: CouponStatus.DISABLED },
    });
  }

  async validate(
    data: ValidateCouponDto,
    priceCents: number,
  ): Promise<ValidateCouponResult> {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        organizationId_code: {
          organizationId: data.organizationId,
          code: data.code.toUpperCase(),
        },
      },
    });

    if (!coupon) {
      return { valid: false, error: 'Coupon introuvable' };
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      return { valid: false, error: 'Ce coupon est désactivé' };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, error: 'Ce coupon a expiré' };
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: "Ce coupon a atteint sa limite d'utilisation" };
    }

    if (coupon.planIds.length > 0 && !coupon.planIds.includes(data.planId)) {
      return { valid: false, error: "Ce coupon n'est pas valide pour ce plan" };
    }

    let discountCents: number;
    let discountPercentage: number | undefined;

    if (coupon.type === CouponType.PERCENTAGE) {
      discountPercentage = coupon.discountValue;
      discountCents = Math.round((priceCents * coupon.discountValue) / 100);
    } else {
      discountCents = Math.min(coupon.discountValue, priceCents);
    }

    return {
      valid: true,
      coupon,
      discountCents,
      discountPercentage,
    };
  }

  async incrementUsage(couponId: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  async getUsages(couponId: string) {
    return this.prisma.couponUsage.findMany({
      where: { couponId },
      include: {
        subscription: {
          select: {
            id: true,
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrganizationCurrency(organizationId: string): Promise<string> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { currency: true },
    });

    if (!organization) {
      throw new BadRequestException('Organisation introuvable');
    }

    return organization.currency;
  }
}
