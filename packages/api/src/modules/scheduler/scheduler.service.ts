import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AccessStatus,
  AmbassadorTier,
  ConversionStatus,
  PlatformSubscriptionStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { DataExportsService } from '../data-exports/data-exports.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminDashboardService } from '../admin-dashboard/admin-dashboard.service';

const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 400;
const DEFAULT_PAYMENT_EVENT_RETENTION_DAYS = 730;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TERMINAL_PLATFORM_STATUSES: PlatformSubscriptionStatus[] = [
  PlatformSubscriptionStatus.CANCELED,
  PlatformSubscriptionStatus.INCOMPLETE,
  PlatformSubscriptionStatus.EXPIRED,
];

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelAccessService: ChannelAccessService,
    private readonly config: ConfigService,
    private readonly dataExportsService: DataExportsService,
    private readonly organizationsService: OrganizationsService,
    private readonly notifications: NotificationsService,
    private readonly adminDashboardService: AdminDashboardService,
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
   * Hard-stop customer subscriptions when platform subscription is no longer active.
   * This prevents organizations from keeping paid members after trial/subscription ends.
   * Runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async handleInactivePlatformSubscriptions(): Promise<void> {
    this.logger.log('Starting inactive platform subscription enforcement...');

    const now = new Date();

    const organizationsToDisable = await this.prisma.organization.findMany({
      where: {
        saasActive: true,
        platformSubscription: {
          is: {
            OR: [
              {
                status: {
                  in: TERMINAL_PLATFORM_STATUSES,
                },
                OR: [
                  { graceUntil: null },
                  {
                    graceUntil: {
                      lte: now,
                    },
                  },
                ],
              },
              {
                status: PlatformSubscriptionStatus.PAST_DUE,
                graceUntil: {
                  lte: now,
                },
              },
            ],
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (organizationsToDisable.length > 0) {
      await this.prisma.organization.updateMany({
        where: {
          id: {
            in: organizationsToDisable.map((org) => org.id),
          },
        },
        data: {
          saasActive: false,
        },
      });
    }

    const subscriptionsToRevoke = await this.prisma.subscription.findMany({
      where: {
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.INCOMPLETE,
          ],
        },
        organization: {
          platformSubscription: {
            is: {
              OR: [
                {
                  status: {
                    in: TERMINAL_PLATFORM_STATUSES,
                  },
                  OR: [
                    { graceUntil: null },
                    {
                      graceUntil: {
                        lte: now,
                      },
                    },
                  ],
                },
                {
                  status: PlatformSubscriptionStatus.PAST_DUE,
                  graceUntil: {
                    lte: now,
                  },
                },
              ],
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (subscriptionsToRevoke.length === 0) {
      this.logger.debug(
        'No customer subscriptions to revoke for inactive platform subscriptions',
      );
      return;
    }

    for (const subscription of subscriptionsToRevoke) {
      try {
        await this.channelAccessService.handlePaymentFailure(
          subscription.id,
          'canceled',
        );

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.CANCELED,
            canceledAt: now,
            endedAt: now,
            graceUntil: null,
          },
        });

        this.logger.debug(
          `Hard-stopped subscription ${subscription.id} due to inactive platform subscription`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to hard-stop subscription ${subscription.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Inactive platform subscription enforcement complete: ${subscriptionsToRevoke.length} subscription(s) revoked`,
    );
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

  /**
   * Check platform subscriptions for overdue payments
   * - Send warning email at day 5
   * - Auto-suspend at 7 days OR 3 failed attempts
   * Runs at 9:00 AM every day
   */
  @Cron('0 9 * * *')
  async handlePlatformPaymentOverdue(): Promise<void> {
    this.logger.log('Starting platform payment overdue check...');

    const now = new Date();

    // Find all PAST_DUE platform subscriptions
    const pastDueSubscriptions =
      await this.prisma.platformSubscription.findMany({
        where: {
          status: PlatformSubscriptionStatus.PAST_DUE,
        },
        include: {
          organization: true,
          platformPlan: true,
        },
      });

    if (pastDueSubscriptions.length === 0) {
      this.logger.debug('No past due platform subscriptions found');
      return;
    }

    this.logger.log(
      `Found ${pastDueSubscriptions.length} past due platform subscriptions`,
    );

    let warningsSent = 0;
    let suspensions = 0;
    let errors = 0;

    for (const subscription of pastDueSubscriptions) {
      try {
        const metadata =
          (subscription.metadata as Record<string, unknown> | null) ?? {};
        const failedAttempts = (metadata.failedPaymentAttempts as number) ?? 0;
        const firstFailedAt = metadata.firstFailedAt
          ? new Date(metadata.firstFailedAt as string)
          : null;
        const warningSentAt = metadata.paymentWarningSentAt as string | null;

        // Skip if organization is already suspended
        if (subscription.organization.suspendedAt) {
          continue;
        }

        // Calculate days since first failure
        const daysSinceFirstFailure = firstFailedAt
          ? Math.floor((now.getTime() - firstFailedAt.getTime()) / DAY_IN_MS)
          : 0;

        // Auto-suspend if 7 days OR 3 failed attempts
        if (daysSinceFirstFailure >= 7 || failedAttempts >= 3) {
          const reason =
            failedAttempts >= 3
              ? `Échec de paiement répété (${failedAttempts} tentatives)`
              : `Impayé depuis ${daysSinceFirstFailure} jours`;

          await this.organizationsService.suspend(
            subscription.organizationId,
            reason,
          );

          // Send suspension email
          await this.notifications.sendPlatformSuspensionEmail({
            to: subscription.organization.billingEmail,
            organizationName: subscription.organization.name,
            reason,
            supportEmail: this.config.get<string>('SUPPORT_EMAIL'),
          });

          // Clear metadata
          await this.prisma.platformSubscription.update({
            where: { id: subscription.id },
            data: {
              metadata: {
                ...metadata,
                suspendedAt: now.toISOString(),
                suspendedReason: reason,
              },
            },
          });

          suspensions++;
          this.logger.log(
            `Auto-suspended organization ${subscription.organizationId}: ${reason}`,
          );
          continue;
        }

        // Send warning email at day 5 (if not already sent)
        if (daysSinceFirstFailure >= 5 && !warningSentAt) {
          const daysRemaining = 7 - daysSinceFirstFailure;

          await this.notifications.sendPlatformPaymentWarningEmail({
            to: subscription.organization.billingEmail,
            organizationName: subscription.organization.name,
            daysRemaining: Math.max(1, daysRemaining),
          });

          // Mark warning as sent
          await this.prisma.platformSubscription.update({
            where: { id: subscription.id },
            data: {
              metadata: {
                ...metadata,
                paymentWarningSentAt: now.toISOString(),
              },
            },
          });

          warningsSent++;
          this.logger.log(
            `Payment warning sent to organization ${subscription.organizationId}`,
          );
        }
      } catch (error) {
        errors++;
        this.logger.error(
          `Error processing overdue subscription ${subscription.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Platform payment overdue check complete: ${warningsSent} warnings sent, ${suspensions} suspended, ${errors} errors`,
    );
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

  /**
   * Send monthly VIP reports to activated VIP users
   * Runs on the 1st of each month at 10:00 AM
   */
  @Cron('0 10 1 * *')
  async sendVipMonthlyReports(): Promise<void> {
    this.logger.log('Starting VIP monthly reports...');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // VIPs activated at least 1 month ago, never had a report OR report > 30 days ago
    const vips = await this.prisma.vipInvitation.findMany({
      where: {
        status: { in: ['ACTIVATED', 'CONVERTED'] },
        activatedAt: { lte: oneMonthAgo },
        OR: [
          { lastReportSentAt: null },
          { lastReportSentAt: { lte: oneMonthAgo } },
        ],
      },
    });

    if (vips.length === 0) {
      this.logger.debug('No VIP reports to send');
      return;
    }

    this.logger.log(`Sending VIP reports to ${vips.length} VIP(s)`);

    let sent = 0;
    let errors = 0;

    for (const vip of vips) {
      try {
        if (!vip.organizationId) continue;

        // Get organization stats
        const org = await this.prisma.organization.findUnique({
          where: { id: vip.organizationId },
          select: {
            name: true,
            _count: {
              select: {
                channels: true,
                customers: { where: { deletedAt: null } },
              },
            },
          },
        });

        if (!org) continue;

        await this.notifications.sendVipReportEmail({
          to: vip.email,
          organizationName: org.name,
          channelsCount: org._count.channels,
          customersCount: org._count.customers,
          salesGenerated: vip.salesGenerated,
          offersCreated: vip.offersCreated,
        });

        await this.prisma.vipInvitation.update({
          where: { id: vip.id },
          data: { lastReportSentAt: new Date() },
        });

        sent++;
      } catch (error) {
        errors++;
        this.logger.error(
          `Failed to send VIP report to ${vip.email}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `VIP monthly reports complete: ${sent} sent, ${errors} errors`,
    );
  }

  /**
   * Evaluate ambassador eligibility for all organizations
   * Runs on the 1st of each month at 8:00 AM
   */
  @Cron('0 8 1 * *')
  async evaluateAmbassadorEligibility(): Promise<void> {
    this.logger.log('Starting ambassador eligibility evaluation...');

    const now = new Date();

    try {
      const creators = await this.adminDashboardService.getCreatorsList();

      let updated = 0;

      for (const creator of creators) {
        if (creator.suspendedAt || !creator.saasActive) continue;
        if (creator.healthScore.level !== 'green') continue;

        const tenureMonths = Math.floor(
          (now.getTime() - new Date(creator.createdAt).getTime()) /
            (30 * DAY_IN_MS),
        );

        let tier: AmbassadorTier = AmbassadorTier.NONE;
        if (tenureMonths >= 12) {
          tier = AmbassadorTier.GOLD;
        } else if (tenureMonths >= 6) {
          tier = AmbassadorTier.SILVER;
        } else if (tenureMonths >= 3) {
          tier = AmbassadorTier.BRONZE;
        }

        // Only update if tier changed
        const currentOrg = await this.prisma.organization.findUnique({
          where: { id: creator.id },
          select: { ambassadorTier: true },
        });

        if (currentOrg && currentOrg.ambassadorTier !== tier) {
          await this.prisma.organization.update({
            where: { id: creator.id },
            data: {
              ambassadorTier: tier,
              ambassadorSince: tier !== AmbassadorTier.NONE ? now : null,
            },
          });
          updated++;
        }
      }

      this.logger.log(
        `Ambassador eligibility evaluation complete: ${updated} organization(s) updated`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to evaluate ambassador eligibility: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Process loyalty rewards for SILVER+ ambassadors
   * Gives 1 free month every 6 months
   * Runs on the 1st of each month at 9:00 AM
   */
  @Cron('0 9 1 * *')
  async processLoyaltyRewards(): Promise<void> {
    this.logger.log('Starting loyalty rewards processing...');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Ambassadors SILVER+ who haven't received a reward in 6 months
    const eligible = await this.prisma.organization.findMany({
      where: {
        ambassadorTier: { in: [AmbassadorTier.SILVER, AmbassadorTier.GOLD] },
        saasActive: true,
        suspendedAt: null,
        OR: [
          { lastLoyaltyRewardAt: null },
          { lastLoyaltyRewardAt: { lte: sixMonthsAgo } },
        ],
      },
      include: {
        platformSubscription: true,
        users: { where: { role: 'ORG_ADMIN' }, take: 1 },
      },
    });

    if (eligible.length === 0) {
      this.logger.debug('No loyalty rewards to process');
      return;
    }

    this.logger.log(
      `Processing loyalty rewards for ${eligible.length} ambassador(s)`,
    );

    let rewarded = 0;
    let errors = 0;

    for (const org of eligible) {
      try {
        if (!org.platformSubscription) continue;

        const currentEnd = org.platformSubscription.currentPeriodEnd;
        if (!currentEnd) continue;

        // Extend subscription by 1 month
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + 1);

        const existingMetadata =
          (org.platformSubscription.metadata as Record<string, unknown>) ?? {};

        await this.prisma.$transaction([
          this.prisma.platformSubscription.update({
            where: { id: org.platformSubscription.id },
            data: {
              currentPeriodEnd: newEnd,
              metadata: {
                ...existingMetadata,
                loyaltyRewardGranted: new Date().toISOString(),
              },
            },
          }),
          this.prisma.organization.update({
            where: { id: org.id },
            data: { lastLoyaltyRewardAt: new Date() },
          }),
        ]);

        // Send thank you email
        const ownerEmail = org.users[0]?.email ?? org.billingEmail;
        await this.notifications.sendLoyaltyRewardEmail({
          to: ownerEmail,
          organizationName: org.name,
          tier: org.ambassadorTier,
        });

        rewarded++;
        this.logger.debug(
          `Loyalty reward granted to ${org.name} (${org.ambassadorTier})`,
        );
      } catch (error) {
        errors++;
        this.logger.error(
          `Failed to process loyalty reward for ${org.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Loyalty rewards processing complete: ${rewarded} rewarded, ${errors} errors`,
    );
  }

  /**
   * Validate pending affiliate commissions after validation delay period
   * - Check if subscription is still active after the delay period
   * - If active: PENDING -> APPROVED
   * - If cancelled/refunded: PENDING -> CANCELLED
   * Runs every hour at minute 30
   */
  @Cron('30 * * * *')
  async validateAffiliateCommissions(): Promise<void> {
    this.logger.log('Starting affiliate commission validation...');

    const now = new Date();
    let approved = 0;
    let cancelled = 0;
    let errors = 0;

    // Get all pending referrals that are past their validation delay
    // We need to check each organization's affiliate program settings
    const pendingReferrals = await this.prisma.affiliateReferral.findMany({
      where: {
        status: ConversionStatus.PENDING,
      },
      include: {
        subscription: {
          select: {
            id: true,
            status: true,
            canceledAt: true,
            endedAt: true,
            organizationId: true,
          },
        },
        affiliate: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (pendingReferrals.length === 0) {
      this.logger.debug('No pending affiliate referrals to validate');
      return;
    }

    // Get all affiliate programs for the relevant organizations
    const orgIds = [
      ...new Set(pendingReferrals.map((r) => r.affiliate.organizationId)),
    ];
    const programs = await this.prisma.affiliateProgram.findMany({
      where: {
        organizationId: { in: orgIds },
      },
    });

    const programByOrgId = new Map(programs.map((p) => [p.organizationId, p]));
    const defaultValidationDelayDays = 14;

    for (const referral of pendingReferrals) {
      try {
        const program = programByOrgId.get(referral.affiliate.organizationId);
        const validationDelayDays =
          program?.validationDelayDays ?? defaultValidationDelayDays;

        // Calculate when the referral should be validated
        const validationDate = new Date(referral.createdAt);
        validationDate.setDate(validationDate.getDate() + validationDelayDays);

        // Skip if not yet past validation delay
        if (now < validationDate) {
          continue;
        }

        const subscription = referral.subscription;

        // Check if subscription is cancelled, expired, or ended
        const isSubscriptionInvalid =
          subscription.status === SubscriptionStatus.CANCELED ||
          subscription.status === SubscriptionStatus.EXPIRED ||
          subscription.canceledAt !== null ||
          subscription.endedAt !== null;

        if (isSubscriptionInvalid) {
          // Cancel the referral
          await this.prisma.$transaction([
            this.prisma.affiliateReferral.update({
              where: { id: referral.id },
              data: {
                status: ConversionStatus.CANCELLED,
                cancelledAt: now,
              },
            }),
            this.prisma.affiliate.update({
              where: { id: referral.affiliateId },
              data: {
                totalEarnings: { decrement: referral.commissionCents },
                pendingEarnings: { decrement: referral.commissionCents },
              },
            }),
          ]);

          cancelled++;
          this.logger.debug(
            `Cancelled affiliate referral ${referral.id} - subscription inactive`,
          );
        } else {
          // Approve the referral
          await this.prisma.affiliateReferral.update({
            where: { id: referral.id },
            data: {
              status: ConversionStatus.APPROVED,
              approvedAt: now,
            },
          });

          approved++;
          this.logger.debug(
            `Approved affiliate referral ${referral.id} - subscription still active`,
          );
        }
      } catch (error) {
        errors++;
        this.logger.error(
          `Failed to validate affiliate referral ${referral.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Affiliate commission validation complete: ${approved} approved, ${cancelled} cancelled, ${errors} errors`,
    );
  }
}
