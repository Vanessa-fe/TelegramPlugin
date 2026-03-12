import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GiftCodeStatus, Prisma } from '@prisma/client';
import type { GiftCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateGiftCodeDto,
  UpdateGiftCodeDto,
  ValidateGiftCodeDto,
} from './gift-codes.schema';

export type GiftCodeWithUsageStats = GiftCode & {
  _count: { usages: number };
};

export type ValidateGiftCodeResult = {
  valid: boolean;
  giftCode?: GiftCode;
  isFreeAccess: true;
  error?: string;
};

@Injectable()
export class GiftCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateGiftCodeDto,
    createdById: string,
  ): Promise<GiftCode> {
    const existing = await this.prisma.giftCode.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new BadRequestException('Un code cadeau avec ce code existe déjà');
    }

    const payload: Prisma.GiftCodeCreateInput = {
      code: data.code,
      description: data.description,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      planIds: data.planIds,
      organizationIds: data.organizationIds,
      isPlatformTrial: data.isPlatformTrial ?? false,
      platformPlanName: data.platformPlanName,
      trialDays: data.trialDays,
      createdById,
    };

    return this.prisma.giftCode.create({ data: payload });
  }

  async findAll(): Promise<GiftCodeWithUsageStats[]> {
    return this.prisma.giftCode.findMany({
      include: {
        _count: { select: { usages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<GiftCodeWithUsageStats> {
    const giftCode = await this.prisma.giftCode.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!giftCode) {
      throw new NotFoundException('Code cadeau introuvable');
    }

    return giftCode;
  }

  async update(id: string, data: UpdateGiftCodeDto): Promise<GiftCode> {
    const giftCode = await this.findOne(id);

    if (data.code && data.code !== giftCode.code) {
      const existing = await this.prisma.giftCode.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new BadRequestException(
          'Un code cadeau avec ce code existe déjà',
        );
      }
    }

    const payload: Prisma.GiftCodeUpdateInput = {
      ...(data.code && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      ...(data.planIds && { planIds: data.planIds }),
      ...(data.organizationIds && { organizationIds: data.organizationIds }),
      ...(data.isPlatformTrial !== undefined && {
        isPlatformTrial: data.isPlatformTrial,
      }),
      ...(data.platformPlanName !== undefined && {
        platformPlanName: data.platformPlanName,
      }),
      ...(data.trialDays !== undefined && { trialDays: data.trialDays }),
    };

    return this.prisma.giftCode.update({
      where: { id },
      data: payload,
    });
  }

  async disable(id: string): Promise<GiftCode> {
    await this.findOne(id);

    return this.prisma.giftCode.update({
      where: { id },
      data: { status: GiftCodeStatus.DISABLED },
    });
  }

  async validate(data: ValidateGiftCodeDto): Promise<ValidateGiftCodeResult> {
    const giftCode = await this.prisma.giftCode.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (!giftCode) {
      return {
        valid: false,
        isFreeAccess: true,
        error: 'Code cadeau introuvable',
      };
    }

    if (giftCode.status !== GiftCodeStatus.ACTIVE) {
      return {
        valid: false,
        isFreeAccess: true,
        error: 'Ce code cadeau est désactivé',
      };
    }

    if (giftCode.expiresAt && giftCode.expiresAt < new Date()) {
      return {
        valid: false,
        isFreeAccess: true,
        error: 'Ce code cadeau a expiré',
      };
    }

    if (giftCode.maxUses && giftCode.usedCount >= giftCode.maxUses) {
      return {
        valid: false,
        isFreeAccess: true,
        error: "Ce code cadeau a atteint sa limite d'utilisation",
      };
    }

    // Vérifier si le plan est autorisé
    if (
      giftCode.planIds.length > 0 &&
      !giftCode.planIds.includes(data.planId)
    ) {
      return {
        valid: false,
        isFreeAccess: true,
        error: "Ce code cadeau n'est pas valide pour ce plan",
      };
    }

    // Vérifier si l'organisation est autorisée
    if (
      giftCode.organizationIds.length > 0 &&
      !giftCode.organizationIds.includes(data.organizationId)
    ) {
      return {
        valid: false,
        isFreeAccess: true,
        error: "Ce code cadeau n'est pas valide pour ce créateur",
      };
    }

    return {
      valid: true,
      giftCode,
      isFreeAccess: true,
    };
  }

  async recordUsage(
    giftCodeId: string,
    subscriptionId: string,
    customerId: string,
    customerEmail: string | null,
    planId: string,
    organizationId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.giftCodeUsage.create({
        data: {
          giftCodeId,
          subscriptionId,
          customerId,
          customerEmail,
          planId,
          organizationId,
        },
      }),
      this.prisma.giftCode.update({
        where: { id: giftCodeId },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
  }

  async getUsages(giftCodeId: string) {
    return this.prisma.giftCodeUsage.findMany({
      where: { giftCodeId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
