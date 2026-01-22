import { Injectable, Logger } from '@nestjs/common';
import { $Enums, EntitlementType } from '@prisma/client';
import type { ChannelAccess } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { NotificationsService } from '../notifications/notifications.service';
import type { GrantAccessPayload } from '@telegram-plugin/shared';

@Injectable()
export class ChannelAccessService {
  private readonly logger = new Logger(ChannelAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: ChannelAccessQueue,
    private readonly notifications: NotificationsService,
  ) {}

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

    await this.prisma.$transaction(async (tx) => {
      // Revoke channel accesses
      await tx.channelAccess.updateMany({
        where: {
          subscriptionId,
          status: {
            in: [$Enums.AccessStatus.PENDING, $Enums.AccessStatus.GRANTED],
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
    });

    try {
      await this.queue.enqueueRevokeAccess({ subscriptionId, reason });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue revoke access job for subscription ${subscriptionId}`,
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

      if (reason === 'payment_failed') {
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
      for (const access of subscription.channelAccesses) {
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
