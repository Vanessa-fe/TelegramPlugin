import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AffiliateStatus, PayoutStatus, Prisma } from '@prisma/client';
import type {
  Affiliate,
  AffiliatePayout,
  AffiliateReferral,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateAffiliateDto,
  CreatePayoutDto,
  UpdateAffiliateDto,
  UpdatePayoutDto,
  ValidateAffiliateDto,
} from './affiliates.schema';

const REFERRAL_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const INTERNAL_AFFILIATE_EMAIL_DOMAIN = 'sublynk.local';

function generateReferralCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (const byte of bytes) {
    code += REFERRAL_CODE_ALPHABET[byte % REFERRAL_CODE_ALPHABET.length];
  }
  return code;
}

function normalizeAffiliateEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function buildInternalAffiliateEmail(referralCode: string): string {
  return `affiliate+${referralCode.toLowerCase()}@${INTERNAL_AFFILIATE_EMAIL_DOMAIN}`;
}

export type AffiliateWithStats = Affiliate & {
  _count: { referrals: number; payouts: number };
};

export type ValidateAffiliateResult = {
  valid: boolean;
  affiliate?: Affiliate;
  error?: string;
};

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAffiliateDto): Promise<Affiliate> {
    let referralCode = data.referralCode;
    if (!referralCode) {
      referralCode = generateReferralCode();
    }

    const existingByCode = await this.prisma.affiliate.findUnique({
      where: { referralCode },
    });

    if (existingByCode) {
      throw new BadRequestException('Ce code de parrainage est déjà utilisé');
    }

    const normalizedEmail = normalizeAffiliateEmail(data.email);
    const affiliateEmail =
      normalizedEmail ?? buildInternalAffiliateEmail(referralCode);

    const existingByEmail = await this.prisma.affiliate.findUnique({
      where: {
        organizationId_email: {
          organizationId: data.organizationId,
          email: affiliateEmail,
        },
      },
    });

    if (existingByEmail) {
      throw new BadRequestException('Un affilié avec cet email existe déjà');
    }

    const isLinkOnlyAffiliate = !normalizedEmail;

    const payload: Prisma.AffiliateCreateInput = {
      email: affiliateEmail,
      name: data.name,
      referralCode,
      commissionRate: data.commissionRate,
      status:
        data.status ??
        (isLinkOnlyAffiliate ? AffiliateStatus.ACTIVE : AffiliateStatus.PENDING),
      metadata: data.metadata,
      organization: {
        connect: { id: data.organizationId },
      },
    };

    return this.prisma.affiliate.create({ data: payload });
  }

  async findAll(organizationId: string): Promise<AffiliateWithStats[]> {
    return this.prisma.affiliate.findMany({
      where: { organizationId },
      include: {
        _count: { select: { referrals: true, payouts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<AffiliateWithStats> {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id },
      include: {
        _count: { select: { referrals: true, payouts: true } },
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affilié introuvable');
    }

    return affiliate;
  }

  async update(id: string, data: UpdateAffiliateDto): Promise<Affiliate> {
    const affiliate = await this.findOne(id);
    const normalizedEmail = normalizeAffiliateEmail(data.email);

    if (normalizedEmail && normalizedEmail !== affiliate.email) {
      const existing = await this.prisma.affiliate.findUnique({
        where: {
          organizationId_email: {
            organizationId: affiliate.organizationId,
            email: normalizedEmail,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('Un affilié avec cet email existe déjà');
      }
    }

    if (data.referralCode && data.referralCode !== affiliate.referralCode) {
      const existing = await this.prisma.affiliate.findUnique({
        where: { referralCode: data.referralCode },
      });

      if (existing) {
        throw new BadRequestException('Ce code de parrainage est déjà utilisé');
      }
    }

    const payload: Prisma.AffiliateUpdateInput = {
      ...(normalizedEmail && { email: normalizedEmail }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.referralCode && { referralCode: data.referralCode }),
      ...(data.commissionRate !== undefined && {
        commissionRate: data.commissionRate,
      }),
      ...(data.status && { status: data.status }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    return this.prisma.affiliate.update({
      where: { id },
      data: payload,
    });
  }

  async deactivate(id: string): Promise<Affiliate> {
    await this.findOne(id);

    return this.prisma.affiliate.update({
      where: { id },
      data: { status: AffiliateStatus.DEACTIVATED },
    });
  }

  async validate(data: ValidateAffiliateDto): Promise<ValidateAffiliateResult> {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { referralCode: data.code.toUpperCase() },
    });

    if (!affiliate) {
      return { valid: false, error: 'Code affilié introuvable' };
    }

    if (affiliate.organizationId !== data.organizationId) {
      return { valid: false, error: 'Code affilié introuvable' };
    }

    if (affiliate.status !== AffiliateStatus.ACTIVE) {
      return { valid: false, error: "Cet affilié n'est pas actif" };
    }

    return { valid: true, affiliate };
  }

  async getReferrals(affiliateId: string): Promise<AffiliateReferral[]> {
    return this.prisma.affiliateReferral.findMany({
      where: { affiliateId },
      include: {
        subscription: {
          select: {
            id: true,
            plan: { select: { name: true } },
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
            telegramUsername: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReferral(
    affiliateId: string,
    subscriptionId: string,
    customerId: string,
    amountCents: number,
    currency: string,
  ): Promise<AffiliateReferral> {
    const affiliate = await this.findOne(affiliateId);
    const commissionCents = Math.round(
      (amountCents * affiliate.commissionRate) / 100,
    );

    const referral = await this.prisma.affiliateReferral.create({
      data: {
        affiliateId,
        subscriptionId,
        customerId,
        amountCents,
        commissionCents,
        currency: currency.toLowerCase(),
      },
    });

    await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        totalEarnings: { increment: commissionCents },
        pendingEarnings: { increment: commissionCents },
      },
    });

    return referral;
  }

  async getPayouts(affiliateId: string): Promise<AffiliatePayout[]> {
    return this.prisma.affiliatePayout.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayout(
    affiliateId: string,
    data: CreatePayoutDto,
  ): Promise<AffiliatePayout> {
    const affiliate = await this.findOne(affiliateId);

    if (data.amountCents > affiliate.pendingEarnings) {
      throw new BadRequestException(
        'Le montant du paiement dépasse les gains en attente',
      );
    }

    const payout = await this.prisma.affiliatePayout.create({
      data: {
        affiliateId,
        amountCents: data.amountCents,
        currency: data.currency,
        method: data.method,
        notes: data.notes,
      },
    });

    return payout;
  }

  async updatePayout(
    payoutId: string,
    data: UpdatePayoutDto,
  ): Promise<AffiliatePayout> {
    const payout = await this.prisma.affiliatePayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Paiement introuvable');
    }

    const previousStatus = payout.status;

    const updated = await this.prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: data.status,
        notes: data.notes,
        ...(data.status === PayoutStatus.COMPLETED && {
          processedAt: new Date(),
        }),
      },
    });

    if (
      previousStatus !== PayoutStatus.COMPLETED &&
      data.status === PayoutStatus.COMPLETED
    ) {
      await this.prisma.$transaction([
        this.prisma.affiliate.update({
          where: { id: payout.affiliateId },
          data: {
            pendingEarnings: { decrement: payout.amountCents },
            paidEarnings: { increment: payout.amountCents },
          },
        }),
        this.prisma.affiliateReferral.updateMany({
          where: {
            affiliateId: payout.affiliateId,
            isPaid: false,
          },
          data: { isPaid: true },
        }),
      ]);
    }

    return updated;
  }
}
