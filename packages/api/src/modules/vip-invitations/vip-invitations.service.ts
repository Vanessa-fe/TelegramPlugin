import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateVipInvitationDto } from './vip-invitations.schema';
import type {
  VipInvitation,
  VipInvitationStatus,
  PlatformSubscriptionStatus,
} from '@prisma/client';

// Enriched VIP invitation with organization data
export interface EnrichedVipInvitation extends VipInvitation {
  organizationName?: string | null;
  stripeStatus?: PlatformSubscriptionStatus | 'NONE';
  channelsCount?: number;
}

@Injectable()
export class VipInvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateVipInvitationDto,
    createdById: string,
  ): Promise<VipInvitation> {
    // Check if there's already a pending invitation for this email
    const existing = await this.prisma.vipInvitation.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        status: 'PENDING',
      },
    });

    if (existing) {
      throw new ConflictException(
        'Une invitation est déjà en attente pour cet email',
      );
    }

    return this.prisma.vipInvitation.create({
      data: {
        email: dto.email.toLowerCase(),
        platformPlanName: dto.platformPlanName,
        trialDays: dto.trialDays,
        notes: dto.notes,
        createdById,
      },
    });
  }

  async findAll(options?: {
    status?: VipInvitationStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ invitations: EnrichedVipInvitation[]; total: number }> {
    const where = options?.status ? { status: options.status } : {};

    const [rawInvitations, total] = await Promise.all([
      this.prisma.vipInvitation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.vipInvitation.count({ where }),
    ]);

    // Enrich invitations with organization data
    const invitations = await this.enrichWithOrganizationData(rawInvitations);

    return { invitations, total };
  }

  /**
   * Enrich VIP invitations with organization data (Stripe status, channels count)
   */
  private async enrichWithOrganizationData(
    invitations: VipInvitation[],
  ): Promise<EnrichedVipInvitation[]> {
    // Get all organization IDs that are not null
    const orgIds = invitations
      .map((inv) => inv.organizationId)
      .filter((id): id is string => id !== null);

    if (orgIds.length === 0) {
      // No organizations to fetch, return invitations with default values
      return invitations.map((inv) => ({
        ...inv,
        organizationName: null,
        stripeStatus: 'NONE' as const,
        channelsCount: 0,
      }));
    }

    // Fetch organizations with their platform subscriptions and channel counts
    const organizations = await this.prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: {
        id: true,
        name: true,
        platformSubscription: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            channels: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const orgMap = new Map(
      organizations.map((org) => [
        org.id,
        {
          name: org.name,
          stripeStatus: org.platformSubscription?.status ?? null,
          channelsCount: org._count.channels,
        },
      ]),
    );

    // Enrich each invitation
    return invitations.map((inv) => {
      const orgData = inv.organizationId ? orgMap.get(inv.organizationId) : null;
      return {
        ...inv,
        organizationName: orgData?.name ?? null,
        stripeStatus: orgData?.stripeStatus ?? 'NONE',
        channelsCount: orgData?.channelsCount ?? 0,
      };
    });
  }

  async findOne(id: string): Promise<VipInvitation> {
    const invitation = await this.prisma.vipInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation VIP non trouvée');
    }

    return invitation;
  }

  async findByToken(token: string): Promise<VipInvitation> {
    const invitation = await this.prisma.vipInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation VIP non trouvée');
    }

    return invitation;
  }

  async findRedeemableByToken(
    token: string,
    email: string,
  ): Promise<VipInvitation> {
    const invitation = await this.findByToken(token);
    const normalizedEmail = email.trim().toLowerCase();

    if (invitation.email !== normalizedEmail) {
      throw new BadRequestException(
        "Cette invitation VIP n'est pas associee a cette adresse email",
      );
    }

    if (invitation.status === 'CANCELLED') {
      throw new ConflictException('Cette invitation VIP a ete annulee');
    }

    if (invitation.status === 'EXPIRED') {
      throw new ConflictException('Cette invitation VIP a expire');
    }

    return invitation;
  }

  async markEmailSent(id: string): Promise<VipInvitation> {
    return this.prisma.vipInvitation.update({
      where: { id },
      data: { emailSentAt: new Date() },
    });
  }

  async activate(
    id: string,
    organizationId: string,
    expiresAt: Date,
  ): Promise<VipInvitation> {
    const invitation = await this.findOne(id);

    if (
      (invitation.status === 'ACTIVATED' ||
        invitation.status === 'CONVERTED') &&
      invitation.organizationId === organizationId
    ) {
      return invitation;
    }

    if (invitation.status !== 'PENDING') {
      throw new ConflictException(
        "Seules les invitations en attente peuvent etre activees",
      );
    }

    return this.prisma.vipInvitation.update({
      where: { id },
      data: {
        status: 'ACTIVATED',
        organizationId,
        activatedAt: new Date(),
        expiresAt,
      },
    });
  }

  async markConvertedForOrganization(organizationId: string): Promise<void> {
    await this.prisma.vipInvitation.updateMany({
      where: {
        organizationId,
        status: 'ACTIVATED',
      },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
      },
    });
  }

  async extendTrial(
    id: string,
    additionalDays: number,
  ): Promise<VipInvitation> {
    const invitation = await this.findOne(id);

    if (invitation.status !== 'ACTIVATED') {
      throw new ConflictException(
        'Seules les invitations activées peuvent être prolongées',
      );
    }

    if (!invitation.expiresAt) {
      throw new ConflictException(
        "Cette invitation n'a pas de date d'expiration",
      );
    }

    const newExpiresAt = new Date(invitation.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

    return this.prisma.vipInvitation.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        trialDays: invitation.trialDays + additionalDays,
      },
    });
  }

  async cancel(id: string): Promise<VipInvitation> {
    const invitation = await this.findOne(id);

    if (invitation.status === 'CONVERTED') {
      throw new ConflictException(
        "Impossible d'annuler une invitation déjà convertie",
      );
    }

    return this.prisma.vipInvitation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getStats(): Promise<{
    pending: number;
    activated: number;
    converted: number;
    expired: number;
    conversionRate: number;
  }> {
    const [pending, activated, converted, expired] = await Promise.all([
      this.prisma.vipInvitation.count({ where: { status: 'PENDING' } }),
      this.prisma.vipInvitation.count({ where: { status: 'ACTIVATED' } }),
      this.prisma.vipInvitation.count({ where: { status: 'CONVERTED' } }),
      this.prisma.vipInvitation.count({ where: { status: 'EXPIRED' } }),
    ]);

    const totalCompleted = converted + expired;
    const conversionRate =
      totalCompleted > 0 ? (converted / totalCompleted) * 100 : 0;

    return {
      pending,
      activated,
      converted,
      expired,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }

  /**
   * Increment offersCreated counter for VIP invitation linked to an organization
   * Called when a creator creates a new product
   */
  async incrementOffersCreated(organizationId: string): Promise<void> {
    await this.prisma.vipInvitation.updateMany({
      where: {
        organizationId,
        status: { in: ['ACTIVATED', 'CONVERTED'] },
      },
      data: { offersCreated: { increment: 1 } },
    });
  }

  /**
   * Add sales amount to salesGenerated counter for VIP invitation linked to an organization
   * Called when a payment is received for a subscription
   */
  async addSalesGenerated(
    organizationId: string,
    amountCents: number,
  ): Promise<void> {
    await this.prisma.vipInvitation.updateMany({
      where: {
        organizationId,
        status: { in: ['ACTIVATED', 'CONVERTED'] },
      },
      data: { salesGenerated: { increment: amountCents } },
    });
  }
}
