import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { $Enums, AuditActorType, EntitlementType } from '@prisma/client';
import type { ChannelAccess } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { NotificationsService } from '../notifications/notifications.service';
import type { GrantAccessPayload } from '@telegram-plugin/shared';
import { AuditLogService } from '../audit-log/audit-log.service';

const DEFAULT_GRACE_PERIOD_DAYS = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ChannelAccessService {
  private readonly logger = new Logger(ChannelAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: ChannelAccessQueue,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getGracePeriodDays(): number {
    const rawValue = this.config.get<string>('PAYMENT_GRACE_PERIOD_DAYS');
    if (!rawValue) {
      return DEFAULT_GRACE_PERIOD_DAYS;
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return DEFAULT_GRACE_PERIOD_DAYS;
    }

    return parsed;
  }

  async handlePaymentSuccess(
    subscriptionId: string,
    provider: $Enums.PaymentProvider,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        plan: {
          include: {
            product: {
              include: {
                channels: {
                  include: {
                    channel: true,
                  },
                },
              },
            },
          },
        },
        channelAccesses: true,
      },
    });

    if (!subscription) {
      this.logger.warn(
        `Cannot grant channel access: subscription ${subscriptionId} not found`,
      );
      return;
    }

    if (!subscription.plan?.product) {
      this.logger.warn(
        `Cannot grant channel access: plan/product not resolved for subscription ${subscriptionId}`,
      );
      return;
    }

    const productChannels = subscription.plan.product.channels ?? [];

    if (productChannels.length === 0) {
      this.logger.debug(
        `No channels linked to plan ${subscription.planId}, nothing to grant`,
      );
      return;
    }

    const existingAccessByChannel = new Map<string, ChannelAccess>(
      subscription.channelAccesses.map((access) => [access.channelId, access]),
    );

    const jobs: GrantAccessPayload[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const link of productChannels) {
        const channelId = link.channelId;
        const currentAccess = existingAccessByChannel.get(channelId);

        if (currentAccess?.status === $Enums.AccessStatus.GRANTED) {
          this.logger.debug(
            `Channel ${channelId} already granted for subscription ${subscriptionId}, skipping`,
          );
          continue;
        }

        if (currentAccess?.status === $Enums.AccessStatus.REVOKE_PENDING) {
          await tx.channelAccess.update({
            where: { id: currentAccess.id },
            data: {
              status: $Enums.AccessStatus.GRANTED,
              revokedAt: null,
              revokeReason: null,
            },
          });
          continue;
        }

        const payload: GrantAccessPayload = {
          subscriptionId: subscription.id,
          channelId,
          customerId: subscription.customerId,
          provider: provider.toLowerCase() as GrantAccessPayload['provider'],
        };

        jobs.push(payload);

        if (currentAccess) {
          await tx.channelAccess.update({
            where: { id: currentAccess.id },
            data: {
              status: $Enums.AccessStatus.PENDING,
              grantedAt: null,
              revokedAt: null,
              revokeReason: null,
              inviteId: null,
            },
          });
          continue;
        }

        await tx.channelAccess.create({
          data: {
            subscriptionId: subscription.id,
            channelId,
            customerId: subscription.customerId,
            status: $Enums.AccessStatus.PENDING,
          },
        });

        // Create entitlement for this channel access
        const entitlementKey = `channel_access_${channelId}`;
        const existingEntitlement = await tx.entitlement.findFirst({
          where: {
            subscriptionId: subscription.id,
            entitlementKey,
          },
        });

        if (!existingEntitlement) {
          // Calculate expiry based on plan's accessDurationDays
          const expiresAt = subscription.plan.accessDurationDays
            ? new Date(Date.now() + subscription.plan.accessDurationDays * 24 * 60 * 60 * 1000)
            : null;

          await tx.entitlement.create({
            data: {
              subscriptionId: subscription.id,
              customerId: subscription.customerId,
              entitlementKey,
              type: EntitlementType.CHANNEL_ACCESS,
              resourceId: channelId,
              expiresAt,
            },
          });
        }
      }
    });

    for (const payload of jobs) {
      try {
        await this.queue.enqueueGrantAccess(payload);
      } catch (error) {
        this.logger.error(
          `Failed to enqueue grant access job for subscription ${payload.subscriptionId} and channel ${payload.channelId}`,
          error as Error,
        );
      }
    }

    try {
      await this.auditLogService.create({
        organizationId: subscription.organizationId,
        actorType: AuditActorType.SYSTEM,
        action: 'access.grant',
        resourceType: 'subscription',
        resourceId: subscription.id,
        metadata: {
          provider,
          channels: productChannels.length,
          jobs: jobs.length,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for access grant on subscription ${subscriptionId}`,
        error as Error,
      );
    }

    // Send payment confirmation notification
    try {
      await this.notifications.sendPaymentConfirmation(
        subscription.customerId,
        subscription.id,
        subscription.plan.priceCents,
        subscription.plan.currency,
        subscription.plan.name,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment confirmation notification for subscription ${subscriptionId}`,
        error as Error,
      );
    }
  }

  async handlePaymentFailure(
    subscriptionId: string,
    reason: 'payment_failed' | 'canceled' | 'refund' | 'expired',
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        plan: true,
        channelAccesses: {
          include: { channel: true },
        },
      },
    });

    if (!subscription) {
      this.logger.warn(
        `Cannot revoke channel access: subscription ${subscriptionId} not found`,
      );
      return;
    }

    const now = new Date();
    const activeAccesses = subscription.channelAccesses.filter((access) =>
      [
        $Enums.AccessStatus.PENDING,
        $Enums.AccessStatus.GRANTED,
        $Enums.AccessStatus.REVOKE_PENDING,
      ].includes(access.status),
    );
    const shouldNotifyPaymentFailed =
      reason === 'payment_failed' && !subscription.lastPaymentFailedAt;

    if (reason === 'payment_failed') {
      const gracePeriodDays = this.getGracePeriodDays();
      const gracePeriodMs = gracePeriodDays * DAY_IN_MS;
      const graceUntil =
        subscription.graceUntil && subscription.graceUntil > now
          ? subscription.graceUntil
          : new Date(now.getTime() + gracePeriodMs);
      const graceExpired = subscription.graceUntil
        ? subscription.graceUntil <= now
        : false;

      if (!graceExpired) {
        await this.prisma.$transaction(async (tx) => {
          await tx.channelAccess.updateMany({
            where: {
              subscriptionId,
              status: {
                in: [
                  $Enums.AccessStatus.PENDING,
                  $Enums.AccessStatus.GRANTED,
                ],
              },
            },
            data: {
              status: $Enums.AccessStatus.REVOKE_PENDING,
              revokedAt: null,
              revokeReason: null,
            },
          });

          await tx.subscription.update({
            where: { id: subscriptionId },
            data: {
              graceUntil,
              lastPaymentFailedAt: now,
            },
          });
        });

        try {
          if (shouldNotifyPaymentFailed) {
            await this.notifications.sendPaymentFailed(
              subscription.customerId,
              subscription.id,
              'Échec du paiement',
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to send payment failed notification for subscription ${subscriptionId}`,
            error as Error,
          );
        }

        return;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Revoke channel accesses
      await tx.channelAccess.updateMany({
        where: {
          subscriptionId,
          status: {
            in: [
              $Enums.AccessStatus.PENDING,
              $Enums.AccessStatus.GRANTED,
              $Enums.AccessStatus.REVOKE_PENDING,
            ],
          },
        },
        data: {
          status: $Enums.AccessStatus.REVOKED,
          revokedAt: now,
          revokeReason: reason,
        },
      });

      // Revoke all entitlements for this subscription
      await tx.entitlement.updateMany({
        where: {
          subscriptionId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
          revokeReason: reason,
        },
      });

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          graceUntil: null,
        },
      });
    });

    try {
      await this.queue.enqueueRevokeAccess({ subscriptionId, reason });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue revoke access job for subscription ${subscriptionId}`,
        error as Error,
      );
    }

    try {
      await this.auditLogService.create({
        organizationId: subscription.organizationId,
        actorType: AuditActorType.SYSTEM,
        action: 'access.revoke',
        resourceType: 'subscription',
        resourceId: subscription.id,
        metadata: { reason },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for access revoke on subscription ${subscriptionId}`,
        error as Error,
      );
    }

    // Send notification based on reason
    try {
      const reasonMessages: Record<string, string> = {
        payment_failed: 'Échec du paiement',
        canceled: 'Abonnement annulé',
        refund: 'Remboursement effectué',
        expired: 'Abonnement expiré',
      };

      if (shouldNotifyPaymentFailed) {
        await this.notifications.sendPaymentFailed(
          subscription.customerId,
          subscription.id,
          reasonMessages[reason],
        );
      } else if ((reason === 'canceled' || reason === 'expired') && subscription.plan) {
        await this.notifications.sendSubscriptionCanceled(
          subscription.customerId,
          subscription.plan.name,
        );
      }

      // Notify about each channel access revoked
      for (const access of activeAccesses) {
        if (access.channel && access.channel.title) {
          await this.notifications.sendAccessRevoked(
            subscription.customerId,
            access.channel.title,
            reasonMessages[reason],
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to send revocation notification for subscription ${subscriptionId}`,
        error as Error,
      );
    }
  }
}
