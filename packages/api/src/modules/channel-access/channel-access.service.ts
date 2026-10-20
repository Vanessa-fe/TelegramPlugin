import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  $Enums,
  AuditActorType,
  EntitlementType,
  PlanInterval,
  PaymentEventType,
  PaymentProvider,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import type { ChannelAccess } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ChannelAccessQueue,
  SUSPENSION_REVOKE_REASON,
} from './channel-access.queue';
import { NotificationsService } from '../notifications/notifications.service';
import type { GrantAccessPayload } from '@telegram-plugin/shared';
import { AuditLogService } from '../audit-log/audit-log.service';

const DEFAULT_GRACE_PERIOD_DAYS = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function readTelegramIds(value: Prisma.JsonValue | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string')
    : [];
}

/**
 * When a subscription's access ends: a one-time pass lasts accessDurationDays
 * from the purchase (as in the scheduler's handleExpiredChannelAccesses),
 * otherwise the current period. Null when no end is known.
 */
function accessEndsAt(subscription: {
  startedAt: Date;
  currentPeriodEnd: Date | null;
  plan: { interval: PlanInterval; accessDurationDays: number | null };
}): Date | null {
  if (
    subscription.plan.interval === PlanInterval.ONE_TIME &&
    subscription.plan.accessDurationDays
  ) {
    const endsAt = new Date(subscription.startedAt);
    endsAt.setDate(endsAt.getDate() + subscription.plan.accessDurationDays);
    return endsAt;
  }
  return subscription.currentPeriodEnd;
}

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

  async assertSubscriptionOwnership(
    subscriptionId: string,
    organizationId?: string | null,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { organizationId: true },
    });

    if (
      !subscription ||
      (organizationId !== undefined &&
        subscription.organizationId !== organizationId)
    ) {
      throw new NotFoundException('Subscription not found');
    }
  }

  async grantVerifiedAccess(
    subscriptionId: string,
    organizationId?: string | null,
  ): Promise<void> {
    const provider = await this.assertVerifiedSubscriptionPayment(
      subscriptionId,
      organizationId,
    );

    await this.handlePaymentSuccess(subscriptionId, provider);
  }

  async assertVerifiedSubscriptionPayment(
    subscriptionId: string,
    organizationId?: string | null,
  ): Promise<PaymentProvider> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        organizationId: true,
        status: true,
        paymentEvents: {
          where: {
            type: {
              in: [
                PaymentEventType.CHECKOUT_COMPLETED,
                PaymentEventType.SUBSCRIPTION_CREATED,
                PaymentEventType.INVOICE_PAID,
              ],
            },
          },
          orderBy: { occurredAt: 'desc' },
          select: { provider: true, type: true, payload: true },
        },
      },
    });

    if (
      !subscription ||
      (organizationId !== undefined &&
        subscription.organizationId !== organizationId)
    ) {
      throw new NotFoundException('Subscription not found');
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIALING
    ) {
      throw new ForbiddenException(
        "L'accès ne peut être accordé qu'après validation du paiement",
      );
    }

    const verifiedEvent = subscription.paymentEvents.find((event) =>
      this.isVerifiedPaymentEvidence(
        event.provider,
        event.type,
        event.payload,
        subscription.status,
      ),
    );

    if (!verifiedEvent) {
      throw new ForbiddenException(
        'Aucune preuve de paiement vérifiée pour cet abonnement',
      );
    }

    return verifiedEvent.provider;
  }

  private isVerifiedPaymentEvidence(
    provider: PaymentProvider,
    type: PaymentEventType,
    payload: unknown,
    subscriptionStatus: SubscriptionStatus,
  ): boolean {
    if (
      provider === PaymentProvider.TELEGRAM_STARS &&
      type === PaymentEventType.INVOICE_PAID
    ) {
      return true;
    }

    if (provider !== PaymentProvider.STRIPE) {
      return false;
    }

    const event = payload as {
      data?: {
        object?: {
          payment_status?: string;
          status?: string;
        };
      };
    } | null;
    const object = event?.data?.object;

    switch (type) {
      case PaymentEventType.CHECKOUT_COMPLETED:
        return (
          object?.payment_status === 'paid' ||
          (object?.payment_status === 'no_payment_required' &&
            subscriptionStatus === SubscriptionStatus.TRIALING)
        );
      case PaymentEventType.SUBSCRIPTION_CREATED:
        return object?.status === 'active' || object?.status === 'trialing';
      case PaymentEventType.INVOICE_PAID:
        return object?.status === 'paid';
      default:
        return false;
    }
  }

  async handlePaymentSuccess(
    subscriptionId: string,
    provider: $Enums.PaymentProvider,
    options: { notifyPayment?: boolean } = {},
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
        const channelProvider =
          link.channel?.provider ?? $Enums.ChannelProvider.TELEGRAM;

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
              status:
                channelProvider === $Enums.ChannelProvider.WHATSAPP
                  ? $Enums.AccessStatus.PENDING
                  : $Enums.AccessStatus.GRANTED,
              revokedAt: null,
              revokeReason: null,
            },
          });
          continue;
        }

        if (channelProvider !== $Enums.ChannelProvider.WHATSAPP) {
          const payload: GrantAccessPayload = {
            subscriptionId: subscription.id,
            channelId,
            customerId: subscription.customerId,
            provider: provider.toLowerCase() as GrantAccessPayload['provider'],
          };

          jobs.push(payload);
        }

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
          const expiresAt =
            subscription.plan.interval === PlanInterval.ONE_TIME &&
            subscription.plan.accessDurationDays
              ? new Date(
                  Date.now() +
                    subscription.plan.accessDurationDays * 24 * 60 * 60 * 1000,
                )
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

    if (options.notifyPayment === false) {
      return;
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

  /**
   * Called when a user starts the Telegram bot. A bot cannot message a user by
   * @username, so we attach the numeric Telegram ID here and (re)send invite
   * links for their paid accesses. With a linkToken (per-purchase deep link
   * from the checkout success page) the purchase is identified exactly;
   * otherwise we fall back to matching the @username typed at checkout.
   */
  async linkTelegramAccount(
    telegramUserId: string,
    telegramUsername?: string,
    linkToken?: string,
  ): Promise<{
    linkedCustomers: number;
    invitesQueued: number;
    tokenStatus?: 'linked' | 'invalid' | 'conflict';
  }> {
    const username = telegramUsername?.trim().toLowerCase().replace(/^@/, '');
    let linkedCustomers = 0;
    let tokenStatus: 'linked' | 'invalid' | 'conflict' | undefined;

    if (linkToken) {
      tokenStatus = await this.claimSubscriptionLink(
        linkToken,
        telegramUserId,
        username,
      );
      if (tokenStatus === 'linked') {
        linkedCustomers = 1;
      } else if (tokenStatus === 'conflict') {
        return { linkedCustomers: 0, invitesQueued: 0, tokenStatus };
      }
    }

    if (username && tokenStatus !== 'linked') {
      const result = await this.prisma.customer.updateMany({
        where: {
          telegramUsername: username,
          telegramUserId: null,
          deletedAt: null,
        },
        data: { telegramUserId },
      });
      linkedCustomers = result.count;
    }

    const accesses = await this.prisma.channelAccess.findMany({
      where: {
        customer: { telegramUserId, deletedAt: null },
        status: {
          in: [$Enums.AccessStatus.PENDING, $Enums.AccessStatus.GRANTED],
        },
        channel: { provider: $Enums.ChannelProvider.TELEGRAM },
        subscription: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
      },
      select: {
        subscriptionId: true,
        channelId: true,
        customerId: true,
        subscription: {
          select: {
            paymentEvents: {
              orderBy: { occurredAt: 'desc' },
              take: 1,
              select: { provider: true },
            },
          },
        },
      },
    });

    let invitesQueued = 0;
    for (const access of accesses) {
      const provider =
        access.subscription.paymentEvents[0]?.provider ??
        PaymentProvider.STRIPE;
      try {
        await this.queue.enqueueGrantAccess({
          subscriptionId: access.subscriptionId,
          channelId: access.channelId,
          customerId: access.customerId,
          provider: provider.toLowerCase() as GrantAccessPayload['provider'],
        });
        invitesQueued += 1;
      } catch (error) {
        this.logger.error(
          `Failed to enqueue invite resend for subscription ${access.subscriptionId} and channel ${access.channelId}`,
          error as Error,
        );
      }
    }

    if (linkedCustomers > 0 || invitesQueued > 0) {
      this.logger.log(
        `Telegram account ${telegramUserId} linked to ${linkedCustomers} customer(s), ${invitesQueued} invite(s) queued`,
      );
    }

    return { linkedCustomers, invitesQueued, tokenStatus };
  }

  /**
   * Create the missing channel accesses of paying subscriptions, e.g. when a
   * channel was attached to the offer after the purchase. Payment was already
   * confirmed, so no new "payment confirmed" notification is sent.
   */
  async grantMissingAccesses(options?: {
    productId?: string;
    limit?: number;
  }): Promise<number> {
    const productFilter = options?.productId
      ? Prisma.sql`AND pl."productId" = ${options.productId}`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT s.id
      FROM "Subscription" s
      JOIN "Plan" pl ON pl.id = s."planId"
      JOIN "ProductChannel" pc ON pc."productId" = pl."productId"
      JOIN "Channel" c ON c.id = pc."channelId" AND c."isActive" = true
      WHERE s.status IN ('ACTIVE', 'TRIALING')
        ${productFilter}
        AND NOT EXISTS (
          SELECT 1 FROM "ChannelAccess" ca
          WHERE ca."subscriptionId" = s.id AND ca."channelId" = pc."channelId"
        )
      LIMIT ${options?.limit ?? 50}
    `;

    let granted = 0;
    for (const { id } of rows) {
      try {
        const lastEvent = await this.prisma.paymentEvent.findFirst({
          where: { subscriptionId: id },
          orderBy: { occurredAt: 'desc' },
          select: { provider: true },
        });
        await this.handlePaymentSuccess(
          id,
          lastEvent?.provider ?? PaymentProvider.STRIPE,
          { notifyPayment: false },
        );
        granted += 1;
      } catch (error) {
        this.logger.error(
          `Failed to grant missing accesses for subscription ${id}`,
          error as Error,
        );
      }
    }

    return granted;
  }

  /**
   * Re-enqueue Telegram grants stuck in PENDING, e.g. because Redis was
   * unreachable when the payment webhook tried to enqueue them. Jobs are
   * deduplicated by id, so an access whose job is still queued or retrying is
   * left alone. Also recovers the buyer's email from the Stripe checkout so
   * the worker can email the link to web buyers.
   */
  async retryStalePendingGrants(options?: {
    staleAfterMs?: number;
    limit?: number;
  }): Promise<number> {
    const staleBefore = new Date(
      Date.now() - (options?.staleAfterMs ?? 10 * 60 * 1000),
    );

    const accesses = await this.prisma.channelAccess.findMany({
      where: {
        status: $Enums.AccessStatus.PENDING,
        updatedAt: { lte: staleBefore },
        channel: { provider: $Enums.ChannelProvider.TELEGRAM },
        subscription: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: options?.limit ?? 100,
      select: {
        subscriptionId: true,
        channelId: true,
        customerId: true,
        customer: { select: { email: true } },
        subscription: {
          select: {
            paymentEvents: {
              orderBy: { occurredAt: 'desc' },
              take: 1,
              select: { provider: true },
            },
          },
        },
      },
    });

    let enqueued = 0;
    for (const access of accesses) {
      if (!access.customer.email) {
        await this.backfillEmailFromCheckout(
          access.subscriptionId,
          access.customerId,
        );
      }

      const provider =
        access.subscription.paymentEvents[0]?.provider ??
        PaymentProvider.STRIPE;
      try {
        await this.queue.enqueueGrantAccess({
          subscriptionId: access.subscriptionId,
          channelId: access.channelId,
          customerId: access.customerId,
          provider: provider.toLowerCase() as GrantAccessPayload['provider'],
        });
        enqueued += 1;
      } catch (error) {
        // Queue unavailable: no point trying the rest of the batch now
        this.logger.error(
          `Failed to re-enqueue pending grant for subscription ${access.subscriptionId}`,
          error as Error,
        );
        break;
      }
    }

    return enqueued;
  }

  /**
   * Give buyers back the channels a suspension of their creator took away,
   * once it is lifted. Only subscriptions still paid and within their period
   * get them back: a pass that ended during the suspension stays ended.
   * Returns the number of accesses re-granted.
   */
  async restoreSuspendedAccesses(organizationId: string): Promise<number> {
    const now = new Date();

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        organizationId,
        OR: [
          {
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
          },
          // A buyer behind on payment keeps access until their grace ends
          { status: SubscriptionStatus.PAST_DUE, graceUntil: { gt: now } },
        ],
      },
      select: {
        id: true,
        startedAt: true,
        currentPeriodEnd: true,
        plan: { select: { interval: true, accessDurationDays: true } },
        paymentEvents: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
          select: { provider: true },
        },
      },
    });

    const entitled = subscriptions.filter((subscription) => {
      const endsAt = accessEndsAt(subscription);
      return !endsAt || endsAt > now;
    });
    if (entitled.length === 0) {
      return 0;
    }

    // A revoke still waiting in the queue would kick the buyer after the
    // grant below
    for (const subscription of entitled) {
      try {
        await this.queue.cancelRevokeAccess(
          subscription.id,
          SUSPENSION_REVOKE_REASON,
        );
      } catch (error) {
        this.logger.error(
          `Failed to cancel the suspension revoke of subscription ${subscription.id}`,
          error as Error,
        );
        break;
      }
    }

    const accesses = await this.prisma.channelAccess.findMany({
      where: {
        subscriptionId: { in: entitled.map((subscription) => subscription.id) },
        status: $Enums.AccessStatus.REVOKED,
        revokeReason: SUSPENSION_REVOKE_REASON,
        // The worker never revokes WhatsApp accesses (manual for the creator)
        channel: {
          isActive: true,
          provider: { not: $Enums.ChannelProvider.WHATSAPP },
        },
      },
      select: {
        id: true,
        subscriptionId: true,
        channelId: true,
        customerId: true,
      },
    });
    if (accesses.length === 0) {
      return 0;
    }

    // PENDING, so retryStalePendingGrants picks up a grant the queue missed
    await this.prisma.channelAccess.updateMany({
      where: {
        id: { in: accesses.map((access) => access.id) },
        status: $Enums.AccessStatus.REVOKED,
      },
      data: {
        status: $Enums.AccessStatus.PENDING,
        grantedAt: null,
        revokedAt: null,
        revokeReason: null,
        inviteId: null,
      },
    });

    const lastProvider = new Map(
      entitled.map((subscription) => [
        subscription.id,
        subscription.paymentEvents[0]?.provider,
      ]),
    );
    for (const access of accesses) {
      const provider =
        lastProvider.get(access.subscriptionId) ?? PaymentProvider.STRIPE;
      try {
        await this.queue.enqueueGrantAccess({
          subscriptionId: access.subscriptionId,
          channelId: access.channelId,
          customerId: access.customerId,
          provider: provider.toLowerCase() as GrantAccessPayload['provider'],
        });
      } catch (error) {
        // Queue unavailable: retryStalePendingGrants enqueues the rest later
        this.logger.error(
          `Failed to enqueue the restored grant of subscription ${access.subscriptionId}`,
          error as Error,
        );
        break;
      }
    }

    this.logger.log(
      `Restored ${accesses.length} channel access(es) of organization ${organizationId} after its suspension`,
    );

    return accesses.length;
  }

  private async backfillEmailFromCheckout(
    subscriptionId: string,
    customerId: string,
  ): Promise<void> {
    const checkout = await this.prisma.paymentEvent.findFirst({
      where: { subscriptionId, type: PaymentEventType.CHECKOUT_COMPLETED },
      orderBy: { occurredAt: 'desc' },
      select: { payload: true },
    });
    const payload = checkout?.payload as {
      data?: { object?: { customer_details?: { email?: string | null } } };
    } | null;
    const email = payload?.data?.object?.customer_details?.email
      ?.trim()
      .toLowerCase();

    if (email) {
      await this.prisma.customer.updateMany({
        where: { id: customerId, email: null },
        data: { email },
      });
    }
  }

  /**
   * Called by the bot when someone joins a channel through an invite link the
   * bot generated. Buyers who join from the emailed link never start the bot,
   * so this is often the only moment we learn their Telegram ID — needed to
   * kick them on cancellation. Every account that joins with a paid link is
   * remembered on the access, so a shared link can't outlive the subscription.
   */
  async recordInviteJoin(data: {
    chatId: string;
    inviteLink: string;
    telegramUserId: string;
    telegramUsername?: string;
  }): Promise<{ matched: boolean }> {
    const invite = await this.prisma.telegramInvite.findFirst({
      where: {
        inviteLink: data.inviteLink,
        channel: {
          externalId: data.chatId,
          provider: $Enums.ChannelProvider.TELEGRAM,
        },
      },
      select: {
        id: true,
        channelAccesses: {
          select: {
            id: true,
            metadata: true,
            customer: { select: { id: true, telegramUserId: true } },
          },
        },
      },
    });

    if (!invite || invite.channelAccesses.length === 0) {
      return { matched: false };
    }

    const username = data.telegramUsername
      ?.trim()
      .toLowerCase()
      .replace(/^@/, '');

    await this.prisma.telegramInvite.update({
      where: { id: invite.id },
      data: { usesCount: { increment: 1 } },
    });

    for (const access of invite.channelAccesses) {
      const metadata =
        access.metadata &&
        typeof access.metadata === 'object' &&
        !Array.isArray(access.metadata)
          ? access.metadata
          : {};
      const joinedIds = readTelegramIds(metadata.joinedTelegramUserIds);

      if (!joinedIds.includes(data.telegramUserId)) {
        await this.prisma.channelAccess.update({
          where: { id: access.id },
          data: {
            metadata: {
              ...metadata,
              joinedTelegramUserIds: [...joinedIds, data.telegramUserId],
            },
          },
        });
      }

      const knownId = access.customer.telegramUserId;
      if (!knownId) {
        await this.prisma.customer.updateMany({
          where: { id: access.customer.id, telegramUserId: null },
          data: {
            telegramUserId: data.telegramUserId,
            ...(username ? { telegramUsername: username } : {}),
          },
        });
      } else if (knownId !== data.telegramUserId) {
        this.logger.warn(
          `Access ${access.id} invite used by Telegram account ${data.telegramUserId}, customer is linked to ${knownId}`,
        );
      }
    }

    return { matched: true };
  }

  /**
   * First Telegram account to open the purchase deep link owns it; a different
   * account reusing the same link is refused so a shared URL can't be claimed.
   */
  private async claimSubscriptionLink(
    linkToken: string,
    telegramUserId: string,
    username?: string,
  ): Promise<'linked' | 'invalid' | 'conflict'> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { telegramLinkToken: linkToken },
      select: {
        id: true,
        customer: { select: { id: true, telegramUserId: true } },
      },
    });

    if (!subscription) {
      return 'invalid';
    }

    const currentId = subscription.customer.telegramUserId;
    if (currentId && currentId !== telegramUserId) {
      this.logger.warn(
        `Purchase link for subscription ${subscription.id} opened by another Telegram account, refused`,
      );
      return 'conflict';
    }

    // Conditional update so two accounts racing on the same link can't both win
    const result = await this.prisma.customer.updateMany({
      where: {
        id: subscription.customer.id,
        OR: [{ telegramUserId: null }, { telegramUserId }],
      },
      data: {
        telegramUserId,
        ...(username ? { telegramUsername: username } : {}),
      },
    });

    return result.count > 0 ? 'linked' : 'conflict';
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
    const activeAccesses = subscription.channelAccesses.filter(
      (access) =>
        access.status === $Enums.AccessStatus.PENDING ||
        access.status === $Enums.AccessStatus.GRANTED ||
        access.status === $Enums.AccessStatus.REVOKE_PENDING,
    );
    const graceEligibleAccesses = subscription.channelAccesses.filter(
      (access) =>
        access.status === $Enums.AccessStatus.PENDING ||
        access.status === $Enums.AccessStatus.GRANTED,
    );
    const nonWhatsappGraceIds = graceEligibleAccesses
      .filter(
        (access) =>
          access.channel?.provider !== $Enums.ChannelProvider.WHATSAPP,
      )
      .map((access) => access.id);
    const whatsappAccessIds = activeAccesses
      .filter(
        (access) =>
          access.channel?.provider === $Enums.ChannelProvider.WHATSAPP,
      )
      .map((access) => access.id);
    const nonWhatsappAccessIds = activeAccesses
      .filter(
        (access) =>
          access.channel?.provider !== $Enums.ChannelProvider.WHATSAPP,
      )
      .map((access) => access.id);
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
          if (nonWhatsappGraceIds.length > 0) {
            await tx.channelAccess.updateMany({
              where: {
                id: { in: nonWhatsappGraceIds },
              },
              data: {
                status: $Enums.AccessStatus.REVOKE_PENDING,
                revokedAt: null,
                revokeReason: null,
              },
            });
          }

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
      // Revoke channel accesses (manual for WhatsApp)
      if (nonWhatsappAccessIds.length > 0) {
        await tx.channelAccess.updateMany({
          where: {
            id: { in: nonWhatsappAccessIds },
          },
          data: {
            status: $Enums.AccessStatus.REVOKED,
            revokedAt: now,
            revokeReason: reason,
          },
        });
      }

      if (whatsappAccessIds.length > 0) {
        await tx.channelAccess.updateMany({
          where: {
            id: { in: whatsappAccessIds },
          },
          data: {
            status: $Enums.AccessStatus.REVOKE_PENDING,
            revokedAt: now,
            revokeReason: reason,
          },
        });
      }

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
      } else if (
        (reason === 'canceled' || reason === 'expired') &&
        subscription.plan
      ) {
        await this.notifications.sendSubscriptionCanceled(
          subscription.customerId,
          subscription.plan.name,
        );
      }

      // Notify about each channel access revoked, except channels the
      // customer still has through another subscription
      for (const access of activeAccesses) {
        if (
          await this.keepsChannelAccess(
            access.channelId,
            subscription.id,
            subscription.customerId,
            subscription.customer?.telegramUserId,
          )
        ) {
          continue;
        }
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

  /**
   * Whether the customer still holds the channel through another live
   * subscription (mirrors the worker's check before kicking a member).
   */
  private async keepsChannelAccess(
    channelId: string,
    subscriptionId: string,
    customerId: string,
    telegramUserId?: string | null,
  ): Promise<boolean> {
    const other = await this.prisma.channelAccess.findFirst({
      where: {
        channelId,
        subscriptionId: { not: subscriptionId },
        status: {
          in: [
            $Enums.AccessStatus.PENDING,
            $Enums.AccessStatus.GRANTED,
            $Enums.AccessStatus.REVOKE_PENDING,
          ],
        },
        subscription: {
          status: {
            in: [
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.TRIALING,
              SubscriptionStatus.PAST_DUE,
            ],
          },
        },
        OR: [
          { customerId },
          ...(telegramUserId ? [{ customer: { telegramUserId } }] : []),
        ],
      },
      select: { id: true },
    });
    return other !== null;
  }

  async confirmManualGrant(accessId: string, organizationId?: string | null) {
    const access = await this.prisma.channelAccess.findUnique({
      where: { id: accessId },
      include: {
        channel: true,
      },
    });

    if (!access) {
      throw new NotFoundException('Channel access not found');
    }

    if (
      organizationId !== undefined &&
      access.channel.organizationId !== organizationId
    ) {
      throw new NotFoundException('Channel access not found');
    }

    if (access.channel.provider !== $Enums.ChannelProvider.WHATSAPP) {
      throw new BadRequestException(
        'Manual confirmation is only available for WhatsApp channels',
      );
    }

    await this.assertVerifiedSubscriptionPayment(
      access.subscriptionId,
      organizationId,
    );

    if (access.status === $Enums.AccessStatus.GRANTED) {
      return access;
    }

    const now = new Date();

    return this.prisma.channelAccess.update({
      where: { id: accessId },
      data: {
        status: $Enums.AccessStatus.GRANTED,
        grantedAt: now,
        revokedAt: null,
        revokeReason: null,
      },
      include: {
        channel: true,
      },
    });
  }

  async confirmManualRevoke(accessId: string, organizationId?: string | null) {
    const access = await this.prisma.channelAccess.findUnique({
      where: { id: accessId },
      include: {
        channel: true,
      },
    });

    if (!access) {
      throw new NotFoundException('Channel access not found');
    }

    if (
      organizationId !== undefined &&
      access.channel.organizationId !== organizationId
    ) {
      throw new NotFoundException('Channel access not found');
    }

    if (access.channel.provider !== $Enums.ChannelProvider.WHATSAPP) {
      throw new BadRequestException(
        'Manual confirmation is only available for WhatsApp channels',
      );
    }

    if (access.status === $Enums.AccessStatus.REVOKED) {
      return access;
    }

    const now = new Date();

    return this.prisma.channelAccess.update({
      where: { id: accessId },
      data: {
        status: $Enums.AccessStatus.REVOKED,
        revokedAt: now,
        revokeReason: access.revokeReason ?? 'manual',
      },
      include: {
        channel: true,
      },
    });
  }
}
