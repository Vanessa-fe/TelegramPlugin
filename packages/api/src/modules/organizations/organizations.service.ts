import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditActorType,
  Prisma,
  Organization,
  PlatformSubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { syncOfferReadyToBrevo } from '../../common/offer-readiness';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './organizations.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  ChannelAccessQueue,
  SUSPENSION_REVOKE_REASON,
} from '../channel-access/channel-access.queue';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { PlatformSubscriptionService } from '../platform-subscription/platform-subscription.service';

export type OrganizationListItem = Organization & {
  platformPlan: string | null;
  platformStatus: PlatformSubscriptionStatus | null;
};

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly channelAccessQueue: ChannelAccessQueue,
    private readonly channelAccessService: ChannelAccessService,
    private readonly platformSubscriptionService: PlatformSubscriptionService,
  ) {}

  create(data: CreateOrganizationDto): Promise<Organization> {
    const payload: Prisma.OrganizationCreateInput = {
      name: data.name,
      slug: data.slug,
      billingEmail: data.billingEmail,
      currency: data.currency ?? 'EUR',
      saasActive: data.saasActive ?? false,
      timezone: data.timezone ?? 'UTC',
      metadata: data.metadata,
    };

    return this.prisma.organization.create({ data: payload });
  }

  async findAll(): Promise<OrganizationListItem[]> {
    const organizations = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
        users: { some: {} },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        platformSubscription: {
          select: {
            status: true,
            platformPlan: {
              select: { displayName: true, name: true },
            },
          },
        },
      },
    });

    return organizations.map(({ platformSubscription, ...organization }) => ({
      ...organization,
      platformPlan:
        platformSubscription?.platformPlan?.displayName ??
        platformSubscription?.platformPlan?.name ??
        null,
      platformStatus: platformSubscription?.status ?? null,
    }));
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, data: UpdateOrganizationDto): Promise<Organization> {
    const update: Prisma.OrganizationUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.billingEmail && { billingEmail: data.billingEmail }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.saasActive !== undefined && { saasActive: data.saasActive }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    try {
      const organization = await this.prisma.organization.update({
        where: { id },
        data: update,
      });
      if (data.saasActive !== undefined) {
        await syncOfferReadyToBrevo(this.prisma, id, this.logger);
      }
      return organization;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Organization not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Ce slug est déjà utilisé');
        }
      }

      throw error;
    }
  }

  /**
   * Suspend an organization manually (SUPERADMIN only)
   * - Sets saasActive to false
   * - Revokes all active channel accesses
   * - Creates an audit log entry
   */
  async suspend(
    id: string,
    reason?: string,
    actorId?: string,
  ): Promise<Organization> {
    // 1. Verify org exists and is not already suspended
    const org = await this.findOne(id);
    if (org.suspendedAt) {
      throw new BadRequestException('Organisation déjà suspendue');
    }

    // 2. Update the organization
    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        saasActive: false,
        suspendedAt: new Date(),
        suspendReason: reason ?? 'manual',
      },
    });
    await syncOfferReadyToBrevo(this.prisma, id, this.logger);

    // 3. Revoke all active accesses
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        organizationId: id,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      select: { id: true },
    });

    for (const sub of subscriptions) {
      await this.channelAccessQueue.enqueueRevokeAccess({
        subscriptionId: sub.id,
        reason: SUSPENSION_REVOKE_REASON,
      });
    }

    // 4. Audit log
    await this.auditLogService.create({
      organizationId: id,
      actorId,
      actorType: AuditActorType.USER,
      action: 'organization.suspended',
      resourceType: 'organization',
      resourceId: id,
      metadata: { reason, revokedSubscriptions: subscriptions.length },
    });

    return updated;
  }

  /**
   * Unsuspend an organization (SUPERADMIN only)
   * - Clears suspendedAt and suspendReason
   * - Recalculates saasActive based on platform subscription and Stripe Connect status
   * - Gives buyers still paid and within their period their channels back
   * - Creates an audit log entry
   */
  async unsuspend(id: string, actorId?: string): Promise<Organization> {
    const org = await this.findOne(id);
    if (!org.suspendedAt) {
      throw new BadRequestException('Organisation non suspendue');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        suspendedAt: null,
        suspendReason: null,
        // Note: saasActive stays false, will be updated by updateSaasActive()
      },
    });

    // Recalculate saasActive based on platform subscription + Stripe Connect
    await this.platformSubscriptionService.updateSaasActive(id);

    const restoredAccesses =
      await this.channelAccessService.restoreSuspendedAccesses(id);

    await this.auditLogService.create({
      organizationId: id,
      actorId,
      actorType: AuditActorType.USER,
      action: 'organization.unsuspended',
      resourceType: 'organization',
      resourceId: id,
      metadata: { restoredAccesses },
    });

    // Fetch the updated organization with the new saasActive value
    return this.findOne(id);
  }
}
