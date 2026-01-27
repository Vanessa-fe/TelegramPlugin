import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AuditActorType,
  Prisma,
  ProductStatus,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const DELETED_EMAIL_DOMAIN = 'example.invalid';

type DeleteCustomerInput = {
  organizationId: string;
  customerId: string;
  actorId?: string | null;
  actorRole?: UserRole;
  correlationId?: string | null;
  requestId?: string | null;
  viaOrganizationDeletion?: boolean;
};

type DeleteOrganizationInput = {
  organizationId: string;
  actorId?: string | null;
  actorRole?: UserRole;
  correlationId?: string | null;
  requestId?: string | null;
};

@Injectable()
export class DataDeletionsService {
  private readonly logger = new Logger(DataDeletionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelAccessService: ChannelAccessService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async deleteCustomer(input: DeleteCustomerInput): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    if (!customer || customer.organizationId !== input.organizationId) {
      throw new NotFoundException('Client introuvable');
    }

    if (customer.deletedAt) {
      return;
    }

    const now = new Date();
    const subscriptions = await this.prisma.subscription.findMany({
      where: { customerId: input.customerId },
      select: { id: true },
    });
    const subscriptionIds = subscriptions.map(
      (subscription) => subscription.id,
    );

    for (const subscriptionId of subscriptionIds) {
      await this.channelAccessService.handlePaymentFailure(
        subscriptionId,
        'canceled',
      );
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: now,
          endedAt: now,
          graceUntil: null,
        },
      });
    }

    if (subscriptionIds.length > 0) {
      await this.prisma.paymentEvent.updateMany({
        where: { subscriptionId: { in: subscriptionIds } },
        data: { payload: {} },
      });
    }

    await this.prisma.customer.update({
      where: { id: input.customerId },
      data: {
        email: null,
        displayName: null,
        telegramUserId: null,
        telegramUsername: null,
        externalId: null,
        metadata: Prisma.DbNull,
        deletedAt: now,
      },
    });

    await this.auditLogService.create({
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      actorType: input.actorId ? AuditActorType.USER : AuditActorType.SYSTEM,
      action: 'rgpd.customer.deleted',
      resourceType: 'customer',
      resourceId: input.customerId,
      correlationId: this.resolveCorrelationId(
        input.correlationId,
        input.requestId,
      ),
      metadata: this.buildMetadata(input.actorRole, input.requestId, {
        subscriptionsRevoked: subscriptionIds.length,
        viaOrganizationDeletion: input.viaOrganizationDeletion ?? false,
      }),
    });
  }

  async deleteOrganization(input: DeleteOrganizationInput): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organisation introuvable');
    }

    if (organization.deletedAt) {
      return;
    }

    const now = new Date();
    const customers = await this.prisma.customer.findMany({
      where: { organizationId: input.organizationId },
      select: { id: true },
    });

    for (const customer of customers) {
      await this.deleteCustomer({
        organizationId: input.organizationId,
        customerId: customer.id,
        actorId: input.actorId,
        actorRole: input.actorRole,
        correlationId: input.correlationId,
        requestId: input.requestId,
        viaOrganizationDeletion: true,
      });
    }

    const users = await this.prisma.user.findMany({
      where: { organizationId: input.organizationId },
      select: { id: true },
    });

    for (const user of users) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: this.buildDeletedEmail('deleted-user', user.id),
          firstName: null,
          lastName: null,
          passwordHash: null,
          lastLoginAt: null,
          isActive: false,
          organizationId: null,
        },
      });
    }

    const products = await this.prisma.product.findMany({
      where: { organizationId: input.organizationId },
      select: { id: true },
    });
    const productIds = products.map((product) => product.id);

    await this.prisma.product.updateMany({
      where: { organizationId: input.organizationId },
      data: { status: ProductStatus.ARCHIVED },
    });

    if (productIds.length > 0) {
      await this.prisma.plan.updateMany({
        where: { productId: { in: productIds } },
        data: { isActive: false },
      });
    }

    await this.prisma.channel.updateMany({
      where: { organizationId: input.organizationId },
      data: { isActive: false },
    });

    await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        name: `Deleted Organization ${input.organizationId.slice(0, 8)}`,
        slug: `deleted-${input.organizationId}`,
        billingEmail: this.buildDeletedEmail(
          'deleted-org',
          input.organizationId,
        ),
        stripeAccountId: null,
        saasActive: false,
        metadata: Prisma.DbNull,
        deletedAt: now,
      },
    });

    await this.auditLogService.create({
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      actorType: input.actorId ? AuditActorType.USER : AuditActorType.SYSTEM,
      action: 'rgpd.organization.deleted',
      resourceType: 'organization',
      resourceId: input.organizationId,
      correlationId: this.resolveCorrelationId(
        input.correlationId,
        input.requestId,
      ),
      metadata: this.buildMetadata(input.actorRole, input.requestId, {
        customersDeleted: customers.length,
        usersDeactivated: users.length,
      }),
    });

    this.logger.log(`Organization ${input.organizationId} deleted`);
  }

  private buildDeletedEmail(prefix: string, id: string): string {
    return `${prefix}+${id}@${DELETED_EMAIL_DOMAIN}`;
  }

  private resolveCorrelationId(
    correlationId?: string | null,
    requestId?: string | null,
  ): string | null {
    return correlationId ?? requestId ?? null;
  }

  private buildMetadata(
    actorRole?: UserRole,
    requestId?: string | null,
    extra?: Record<string, unknown>,
  ): Prisma.JsonValue | undefined {
    const metadata: Record<string, unknown> = {};

    if (actorRole) {
      metadata.actorRole = actorRole;
    }

    if (requestId) {
      metadata.requestId = requestId;
    }

    if (extra) {
      Object.assign(metadata, extra);
    }

    return Object.keys(metadata).length > 0
      ? (metadata as Prisma.JsonValue)
      : undefined;
  }
}
