import { Injectable, Logger } from '@nestjs/common';
import { AuditActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditLogInput = {
  organizationId: string;
  actorId?: string | null;
  actorType?: AuditActorType;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  correlationId?: string | null;
  metadata?: Prisma.JsonValue;
};

export type SubscriptionAuditLogInput = Omit<
  AuditLogInput,
  'organizationId'
> & {
  subscriptionId: string;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(entry: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorId: entry.actorId ?? null,
        actorType: entry.actorType ?? AuditActorType.USER,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        correlationId: entry.correlationId ?? null,
        metadata: entry.metadata ?? undefined,
      },
    });
  }

  async createForSubscription(entry: SubscriptionAuditLogInput): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: entry.subscriptionId },
      select: { organizationId: true },
    });

    if (!subscription) {
      this.logger.warn(
        `Audit log skipped: subscription ${entry.subscriptionId} not found`,
      );
      return;
    }

    await this.create({
      organizationId: subscription.organizationId,
      actorId: entry.actorId,
      actorType: entry.actorType,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      correlationId: entry.correlationId,
      metadata: entry.metadata,
    });
  }
}
