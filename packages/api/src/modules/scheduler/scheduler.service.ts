import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccessStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { DataExportsService } from '../data-exports/data-exports.service';

const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 400;
const DEFAULT_PAYMENT_EVENT_RETENTION_DAYS = 730;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelAccessService: ChannelAccessService,
    private readonly config: ConfigService,
    private readonly dataExportsService: DataExportsService,
  ) {}

  /**
   * Check for expired entitlements every hour and revoke access
   * Runs at minute 0 of every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredEntitlements(): Promise<void> {
    this.logger.log('Starting expired entitlements check...');

    const now = new Date();

    // Find all active entitlements that have expired
    const expiredEntitlements = await this.prisma.entitlement.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        revokedAt: null,
      },
      include: {
        subscription: {
          include: {
            customer: true,
            plan: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    if (expiredEntitlements.length === 0) {
      this.logger.debug('No expired entitlements found');
      return;
    }

    this.logger.log(`Found ${expiredEntitlements.length} expired entitlements`);

    let revokedCount = 0;
    let errorCount = 0;

    for (const entitlement of expiredEntitlements) {
      try {
        // Mark entitlement as revoked
        await this.prisma.entitlement.update({
          where: { id: entitlement.id },
          data: {
            revokedAt: now,
            revokeReason: 'expired',
          },
        });

        revokedCount++;
        this.logger.debug(
          `Revoked entitlement ${entitlement.id} for customer ${entitlement.customerId}`,
        );
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Failed to revoke entitlement ${entitlement.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Expired entitlements check complete: ${revokedCount} revoked, ${errorCount} errors`,
    );
  }

  /**
   * Revoke access after grace period expiration
   * Runs every 15 minutes
   */
  @Cron('*/15 * * * *')
  async handleExpiredGracePeriods(): Promise<void> {
    this.logger.log('Starting grace period expiration check...');

    const now = new Date();

    const expiredGraceSubscriptions = await this.prisma.subscription.findMany({
      where: {
        graceUntil: {
          lte: now,
        },
        status: SubscriptionStatus.PAST_DUE,
      },
      select: {
        id: true,
      },
    });

    if (expiredGraceSubscriptions.length === 0) {
      this.logger.debug('No expired grace periods found');
      return;
    }

    for (const subscription of expiredGraceSubscriptions) {
      try {
        await this.channelAccessService.handlePaymentFailure(
          subscription.id,
          'payment_failed',
        );
        this.logger.debug(
          `Revoked access after grace period for subscription ${subscription.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to revoke access after grace period for subscription ${subscription.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Grace period expiration check complete');
  }

  /**
   * Check for expired channel accesses every hour and revoke them
   * This handles cases where entitlements are time-based
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredChannelAccesses(): Promise<void> {
    this.logger.log('Starting expired channel accesses check...');

    const now = new Date();

    // Find subscriptions with expired periods that still have active access
    const expiredAccesses = await this.prisma.channelAccess.findMany({
      where: {
        status: AccessStatus.GRANTED,
        subscription: {
          OR: [
            // Subscription period ended
            {
              currentPeriodEnd: {
                lte: now,
              },
              status: {
                in: ['CANCELED', 'EXPIRED'],
              },
            },
            // One-time purchase (filtered in-memory using accessDurationDays)
            {
              plan: {
                interval: 'ONE_TIME',
                accessDurationDays: {
                  not: null,
                },
              },
              startedAt: {
                lte: now,
              },
            },
          ],
        },
      },
      include: {
        subscription: {
          include: {
            plan: true,
            customer: true,
          },
        },
        channel: true,
      },
    });

    // Filter one-time purchases that have actually expired based on accessDurationDays
    const actuallyExpired = expiredAccesses.filter((access) => {
      if (access.subscription.plan.interval !== 'ONE_TIME') {
        return true; // Non one-time are already filtered by currentPeriodEnd
      }

      const accessDays = access.subscription.plan.accessDurationDays;
      if (!accessDays) {
        return false; // No expiration for one-time without duration
      }

      const expiresAt = new Date(access.subscription.startedAt);
      expiresAt.setDate(expiresAt.getDate() + accessDays);

      return expiresAt <= now;
    });

    if (actuallyExpired.length === 0) {
      this.logger.debug('No expired channel accesses found');
      return;
    }

    this.logger.log(`Found ${actuallyExpired.length} expired channel accesses`);

    // Group by subscription to process together
    const subscriptionIds = [
      ...new Set(actuallyExpired.map((a) => a.subscriptionId)),
    ];

    for (const subscriptionId of subscriptionIds) {
      try {
        await this.channelAccessService.handlePaymentFailure(
          subscriptionId,
          'expired',
        );
        this.logger.debug(`Revoked access for subscription ${subscriptionId}`);
      } catch (error) {
        this.logger.error(
          `Failed to revoke access for subscription ${subscriptionId}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Expired channel accesses check complete');
  }

  /**
   * Clean up old revoked invite links every day
   * Runs at 3:00 AM every day
   */
  @Cron('0 3 * * *')
  async cleanupOldInvites(): Promise<void> {
    this.logger.log('Starting old invites cleanup...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.telegramInvite.deleteMany({
      where: {
        status: {
          in: ['REVOKED', 'EXPIRED'],
        },
        revokedAt: {
          lte: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old invite records`);
  }

  /**
   * Send expiration reminders 3 days before subscription ends
   * Runs at 10:00 AM every day
   */
  @Cron('0 10 * * *')
  async sendExpirationReminders(): Promise<void> {
    this.logger.log('Starting expiration reminders...');

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // Find subscriptions expiring in ~3 days
    const expiringSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: threeDaysFromNow,
          lt: fourDaysFromNow,
        },
      },
      include: {
        customer: true,
        plan: {
          include: {
            product: true,
          },
        },
      },
    });

    const subscriptionsToNotify = expiringSubscriptions.filter(
      (subscription) => {
        const metadata = subscription.metadata as Record<
          string,
          unknown
        > | null;
        return metadata?.expirationReminderSent !== true;
      },
    );

    this.logger.log(
      `Found ${subscriptionsToNotify.length} subscriptions expiring soon`,
    );

    // Note: Actual notification sending is handled by NotificationsService
    // Here we just mark them for the notification system to pick up
    for (const subscription of subscriptionsToNotify) {
      try {
        const existingMetadata =
          (subscription.metadata as Record<string, unknown> | null) ?? {};
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            metadata: {
              ...existingMetadata,
              expirationReminderSent: true,
              expirationReminderSentAt: now.toISOString(),
            },
          },
        });

        // Log for now - in production this would trigger NotificationsService
        this.logger.debug(
          `Marked subscription ${subscription.id} for expiration reminder (customer: ${subscription.customer.email || subscription.customer.telegramUserId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process reminder for subscription ${subscription.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Expiration reminders check complete');
  }

  /**
   * Clean up audit logs and payment events based on retention settings
   * Runs daily at 2:30 AM
   */
  @Cron('30 2 * * *')
  async cleanupRetentionData(): Promise<void> {
    this.logger.log('Starting retention cleanup...');

    const auditRetentionDays = this.getRetentionDays(
      'AUDIT_LOG_RETENTION_DAYS',
      DEFAULT_AUDIT_LOG_RETENTION_DAYS,
    );
    const paymentRetentionDays = this.getRetentionDays(
      'PAYMENT_EVENT_RETENTION_DAYS',
      DEFAULT_PAYMENT_EVENT_RETENTION_DAYS,
    );

    const auditCutoff = new Date(Date.now() - auditRetentionDays * DAY_IN_MS);
    const paymentCutoff = new Date(
      Date.now() - paymentRetentionDays * DAY_IN_MS,
    );

    const [auditResult, paymentResult] = await Promise.all([
      this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: auditCutoff,
          },
        },
      }),
      this.prisma.paymentEvent.deleteMany({
        where: {
          createdAt: {
            lt: paymentCutoff,
          },
        },
      }),
    ]);

    this.logger.log(
      `Retention cleanup complete: auditLogs=${auditResult.count}, paymentEvents=${paymentResult.count}`,
    );
  }

  /**
   * Process pending RGPD exports
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handlePendingDataExports(): Promise<void> {
    this.logger.log('Starting data export processing...');

    try {
      await this.dataExportsService.processPendingExports();
    } catch (error) {
      this.logger.error(
        `Failed to process data exports: ${(error as Error).message}`,
      );
    }
  }

  private getRetentionDays(key: string, fallback: number): number {
    const rawValue = this.config.get<string>(key);
    if (!rawValue) {
      return fallback;
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }
}
