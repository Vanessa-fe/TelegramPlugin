import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  PaymentEventType,
  PaymentProvider,
  AuditActorType,
  ConversionStatus,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MetricsService } from '../metrics/metrics.service';
import { PlatformSubscriptionService } from '../platform-subscription/platform-subscription.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { VipInvitationsService } from '../vip-invitations/vip-invitations.service';

export type StripeRawBodyRequest = {
  rawBody?: Buffer | string;
};

interface EventContext {
  organizationId: string;
  subscriptionId?: string;
}

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly channelAccessService: ChannelAccessService,
    private readonly auditLogService: AuditLogService,
    private readonly metricsService: MetricsService,
    private readonly platformSubscriptionService: PlatformSubscriptionService,
    private readonly analyticsService: AnalyticsService,
    private readonly vipInvitationsService: VipInvitationsService,
  ) {
    const apiKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-06-20',
    });
  }

  async handleWebhook(
    signature: string,
    request: StripeRawBodyRequest,
  ): Promise<void> {
    const startTime = process.hrtime.bigint();
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.metricsService.recordWebhookRequest('stripe', 'unknown', 'error');
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.metricsService.recordWebhookRequest('stripe', 'unknown', 'error');
      throw new BadRequestException(
        'Missing raw body for Stripe signature verification',
      );
    }

    let event: Stripe.Event;
    try {
      const bodyToVerify = typeof rawBody === 'string' ? rawBody : rawBody;
      event = this.stripe.webhooks.constructEvent(
        bodyToVerify,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Stripe signature verification failed', error as Error);
      this.metricsService.recordWebhookRequest('stripe', 'unknown', 'error');
      throw new BadRequestException('Invalid Stripe signature');
    }

    try {
      await this.processEvent(event);
      const durationNs = process.hrtime.bigint() - startTime;
      const durationSeconds = Number(durationNs) / 1e9;
      this.metricsService.recordWebhookRequest('stripe', event.type, 'success');
      this.metricsService.recordWebhookDuration(
        'stripe',
        event.type,
        durationSeconds,
      );
    } catch (error) {
      const durationNs = process.hrtime.bigint() - startTime;
      const durationSeconds = Number(durationNs) / 1e9;
      this.metricsService.recordWebhookRequest('stripe', event.type, 'error');
      this.metricsService.recordWebhookDuration(
        'stripe',
        event.type,
        durationSeconds,
      );
      throw error;
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    // Handle Connect account events separately (no PaymentEventType mapping)
    if (event.type === 'account.updated') {
      await this.handleAccountUpdated(event.data.object);
      return;
    }

    // Direct-charge creator events always include event.account.
    // Supported no-account billing events are therefore handled as platform SaaS events.
    if (!event.account && this.isPlatformEvent(event)) {
      this.logger.debug(
        `Routing platform event to PlatformSubscriptionService: ${event.type}`,
      );
      await this.platformSubscriptionService.handleWebhookEvent(event);
      return;
    }

    const mappedType = this.mapEventType(event.type);
    if (!mappedType) {
      this.logger.debug(
        `Ignoring unsupported Stripe event type: ${event.type}`,
      );
      return;
    }

    if (this.isConnectEventExpected(event.type) && !event.account) {
      this.logger.warn(
        `Stripe event ${event.id} missing account for Connect processing, ignoring`,
      );
      return;
    }

    const context = await this.resolveContext(event);
    if (!context) {
      this.logger.warn(
        `Unable to resolve context for event ${event.id} (type ${event.type}), skipping processing`,
      );
      return;
    }

    const occurredAt = new Date(
      (event.created ?? Math.floor(Date.now() / 1000)) * 1000,
    );
    const payload = JSON.parse(JSON.stringify(event)) as Prisma.JsonObject;

    const savedEvent = await this.prisma.paymentEvent.upsert({
      where: {
        provider_externalId: {
          provider: PaymentProvider.STRIPE,
          externalId: event.id,
        },
      },
      create: {
        organizationId: context.organizationId,
        subscriptionId: context.subscriptionId,
        provider: PaymentProvider.STRIPE,
        type: mappedType,
        externalId: event.id,
        payload,
        occurredAt,
      },
      update: {
        payload,
        occurredAt,
        subscriptionId: context.subscriptionId ?? undefined,
        type: mappedType,
      },
    });

    if (savedEvent.processedAt) {
      this.logger.debug(
        `Stripe event ${event.id} already processed, skipping domain side-effects`,
      );
      return;
    }

    if (event.type === 'checkout.session.completed' && context.subscriptionId) {
      await this.syncSubscriptionFromCheckout(
        event.data.object,
        context.subscriptionId,
      );
    }

    await this.applyDomainSideEffects(mappedType, context);

    // Track purchase in GA4 for successful invoice payments
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      await this.analyticsService.trackPurchase({
        transactionId: invoice.id,
        value: (invoice.amount_paid ?? 0) / 100,
        currency: (invoice.currency ?? 'eur').toUpperCase(),
        clientId: context.subscriptionId,
      });

      // Track VIP ROI: add sales generated for VIP invitation linked to this org
      try {
        const amountPaid = invoice.amount_paid ?? 0;
        if (amountPaid > 0) {
          await this.vipInvitationsService.addSalesGenerated(
            context.organizationId,
            amountPaid,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Failed to track VIP sales for org ${context.organizationId}: ${(error as Error).message}`,
        );
      }
    }

    try {
      await this.auditLogService.create({
        organizationId: context.organizationId,
        actorType: AuditActorType.SYSTEM,
        action: 'webhook.stripe.processed',
        resourceType: 'payment_event',
        resourceId: savedEvent.id,
        correlationId: event.id,
        metadata: {
          provider: PaymentProvider.STRIPE,
          eventId: event.id,
          eventType: event.type,
          mappedType,
          subscriptionId: context.subscriptionId ?? null,
          requestId: event.request?.id ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for Stripe webhook ${event.id}`,
        error as Error,
      );
    }

    await this.prisma.paymentEvent.update({
      where: { id: savedEvent.id },
      data: {
        subscriptionId: context.subscriptionId ?? savedEvent.subscriptionId,
        payload,
        occurredAt,
        processedAt: new Date(),
      },
    });
  }

  private async resolveContext(
    event: Stripe.Event,
  ): Promise<EventContext | null> {
    const accountContext = await this.contextFromStripeAccount(event.account);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : undefined;
        if (subscriptionId) {
          const context = await this.contextFromSubscription(subscriptionId);
          if (context) {
            return context;
          }
        }

        const metadataContext = await this.contextFromMetadata(
          session.metadata ?? undefined,
        );
        return metadataContext ?? accountContext;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const context = await this.contextFromSubscription(subscription.id);
        return context ?? accountContext;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : undefined;
        if (!subscriptionId) {
          const metadataContext = await this.contextFromMetadata(
            invoice.metadata ?? undefined,
          );
          return metadataContext ?? accountContext;
        }
        const context = await this.contextFromSubscription(subscriptionId);
        return context ?? accountContext;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        this.logger.debug(
          `Processing charge.refunded: charge=${charge.id}, payment_intent=${charge.payment_intent}, invoice=${charge.invoice}`,
        );

        // 1. Try charge metadata first (usually empty for checkout sessions)
        const chargeMetadataContext = await this.contextFromMetadata(
          charge.metadata ?? undefined,
        );
        if (chargeMetadataContext?.subscriptionId) {
          this.logger.debug(
            `Found subscription from charge metadata: ${chargeMetadataContext.subscriptionId}`,
          );
          return chargeMetadataContext;
        }

        // 2. Try PaymentIntent metadata (where checkout session stores subscriptionId)
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : undefined;
        if (paymentIntentId) {
          try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(
              paymentIntentId,
              undefined,
              event.account ? { stripeAccount: event.account } : undefined,
            );
            const piMetadataContext = await this.contextFromMetadata(
              paymentIntent.metadata ?? undefined,
            );
            if (piMetadataContext?.subscriptionId) {
              this.logger.debug(
                `Found subscription from PaymentIntent metadata: ${piMetadataContext.subscriptionId}`,
              );
              return piMetadataContext;
            }
          } catch (error) {
            this.logger.warn(
              `Failed to retrieve PaymentIntent ${paymentIntentId} for charge ${charge.id}: ${(error as Error).message}`,
            );
          }
        }

        // 3. Try invoice -> subscription path (for recurring subscriptions)
        const invoiceId =
          typeof charge.invoice === 'string' ? charge.invoice : undefined;
        if (invoiceId) {
          try {
            const invoice = await this.stripe.invoices.retrieve(
              invoiceId,
              undefined,
              event.account ? { stripeAccount: event.account } : undefined,
            );
            const stripeSubscriptionId =
              typeof invoice.subscription === 'string'
                ? invoice.subscription
                : undefined;
            if (stripeSubscriptionId) {
              const context =
                await this.contextFromSubscription(stripeSubscriptionId);
              if (context?.subscriptionId) {
                this.logger.debug(
                  `Found subscription from invoice: ${context.subscriptionId}`,
                );
                return context;
              }
            }
          } catch (error) {
            this.logger.warn(
              `Failed to retrieve invoice ${invoiceId} for charge ${charge.id}: ${(error as Error).message}`,
            );
          }
        }

        // 4. Fallback to account context only
        this.logger.warn(
          `Could not resolve subscription for charge.refunded: charge=${charge.id}`,
        );
        return accountContext;
      }
      default:
        return accountContext;
    }
  }

  private async contextFromMetadata(
    metadata?: Stripe.MetadataParam | Stripe.Metadata,
  ): Promise<EventContext | null> {
    if (!metadata) {
      return null;
    }

    const organizationId = this.getMetadataString(
      metadata.organizationId ??
        metadata.organization_id ??
        metadata.orgId ??
        metadata.org_id,
    );

    if (!organizationId) {
      return null;
    }

    const subscriptionId =
      this.getMetadataString(metadata.internalSubscriptionId) ??
      this.getMetadataString(metadata.internal_subscription_id) ??
      this.getMetadataString(metadata.subscriptionId) ??
      this.getMetadataString(metadata.subscription_id) ??
      this.getMetadataString(metadata.subscription) ??
      this.getMetadataString(metadata.subscription_uuid);

    if (subscriptionId && this.isUuid(subscriptionId)) {
      return { organizationId, subscriptionId };
    }

    const stripeSubscriptionId =
      this.getMetadataString(metadata.stripeSubscriptionId) ??
      this.getMetadataString(metadata.stripe_subscription_id) ??
      this.getMetadataString(metadata.subscriptionExternalId) ??
      this.getMetadataString(metadata.subscription_external_id);

    if (stripeSubscriptionId && typeof stripeSubscriptionId === 'string') {
      return this.contextFromSubscription(stripeSubscriptionId);
    }

    return { organizationId };
  }

  private async contextFromSubscription(
    stripeSubscriptionId: string,
  ): Promise<EventContext | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { externalId: stripeSubscriptionId },
      select: { id: true, organizationId: true },
    });

    if (!subscription) {
      this.logger.warn(
        `No subscription found with Stripe external id ${stripeSubscriptionId}`,
      );
      return null;
    }

    return {
      organizationId: subscription.organizationId,
      subscriptionId: subscription.id,
    };
  }

  private async contextFromStripeAccount(
    accountId: string | null | undefined,
  ): Promise<EventContext | null> {
    if (!accountId) {
      return null;
    }

    const organization = await this.prisma.organization.findFirst({
      where: { stripeAccountId: accountId },
      select: { id: true },
    });

    if (!organization) {
      this.logger.warn(
        `No organization found for Stripe account ${accountId}, skipping account context`,
      );
      return null;
    }

    return { organizationId: organization.id };
  }

  private async syncSubscriptionFromCheckout(
    session: Stripe.Checkout.Session,
    subscriptionId: string,
  ): Promise<void> {
    const update: Prisma.SubscriptionUpdateInput = {};

    if (typeof session.subscription === 'string') {
      update.externalId = session.subscription;
    }

    if (typeof session.customer === 'string') {
      update.externalCustomerId = session.customer;
    }

    if (Object.keys(update).length > 0) {
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: update,
      });
    }

    // Process affiliate referral and coupon usage from metadata
    const metadata = session.metadata ?? {};
    await this.processAffiliateAndCoupon(subscriptionId, metadata);
  }

  private async processAffiliateAndCoupon(
    subscriptionId: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          select: {
            id: true,
            priceCents: true,
            currency: true,
            productId: true,
          },
        },
      },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription ${subscriptionId} not found for affiliate/coupon processing`,
      );
      return;
    }

    // Process coupon usage
    const couponId = metadata.couponId;
    const discountCents = metadata.discountCents
      ? parseInt(metadata.discountCents, 10)
      : 0;
    const originalPriceCents = metadata.originalPriceCents
      ? parseInt(metadata.originalPriceCents, 10)
      : subscription.plan.priceCents;
    const quantity = Math.max(1, parseInt(metadata.quantity ?? '1', 10) || 1);
    const totalOriginalCents = originalPriceCents * quantity;
    const totalDiscountCents = discountCents * quantity;

    if (couponId && discountCents > 0) {
      try {
        // Check if coupon usage already exists
        const existingUsage = await this.prisma.couponUsage.findUnique({
          where: { subscriptionId },
        });

        if (!existingUsage) {
          await this.prisma.$transaction([
            this.prisma.couponUsage.create({
              data: {
                couponId,
                subscriptionId,
                customerId: subscription.customerId,
                discountCents: totalDiscountCents,
                originalCents: totalOriginalCents,
              },
            }),
            this.prisma.coupon.update({
              where: { id: couponId },
              data: { usedCount: { increment: 1 } },
            }),
          ]);

          this.logger.debug(
            `Recorded coupon usage for subscription ${subscriptionId}, discount: ${totalDiscountCents} cents`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to record coupon usage for subscription ${subscriptionId}`,
          error as Error,
        );
      }
    }

    // Process affiliate referral
    const affiliateId = metadata.affiliateId;
    const clickId = metadata.clickId ?? metadata.affiliateClickId;

    if (affiliateId) {
      try {
        // Check if referral already exists
        const existingReferral = await this.prisma.affiliateReferral.findUnique(
          { where: { subscriptionId } },
        );

        if (!existingReferral) {
          const affiliate = await this.prisma.affiliate.findUnique({
            where: { id: affiliateId },
          });

          if (affiliate) {
            const finalAmount = Math.max(
              0,
              totalOriginalCents - totalDiscountCents,
            );
            const commissionCents = Math.round(
              (finalAmount * affiliate.commissionRate) / 100,
            );

            // Get productId from the subscription's plan
            const productId = subscription.plan.productId;

            await this.prisma.$transaction([
              this.prisma.affiliateReferral.create({
                data: {
                  affiliateId,
                  subscriptionId,
                  customerId: subscription.customerId,
                  clickId: clickId ?? null,
                  productId,
                  amountCents: finalAmount,
                  commissionCents,
                  currency: subscription.plan.currency.toLowerCase(),
                  status: ConversionStatus.PENDING,
                },
              }),
              this.prisma.affiliate.update({
                where: { id: affiliateId },
                data: {
                  totalEarnings: { increment: commissionCents },
                  pendingEarnings: { increment: commissionCents },
                },
              }),
            ]);

            this.logger.debug(
              `Recorded affiliate referral for subscription ${subscriptionId}, commission: ${commissionCents} cents, status: PENDING`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to record affiliate referral for subscription ${subscriptionId}`,
          error as Error,
        );
      }
    }
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private getMetadataString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private mapEventType(eventType: Stripe.Event.Type): PaymentEventType | null {
    switch (eventType) {
      case 'checkout.session.completed':
        return PaymentEventType.CHECKOUT_COMPLETED;
      case 'customer.subscription.created':
        return PaymentEventType.SUBSCRIPTION_CREATED;
      case 'customer.subscription.updated':
        return PaymentEventType.SUBSCRIPTION_UPDATED;
      case 'customer.subscription.deleted':
        return PaymentEventType.SUBSCRIPTION_CANCELED;
      case 'invoice.payment_succeeded':
        return PaymentEventType.INVOICE_PAID;
      case 'invoice.payment_failed':
        return PaymentEventType.INVOICE_PAYMENT_FAILED;
      case 'charge.refunded':
        return PaymentEventType.REFUND_CREATED;
      default:
        return null;
    }
  }

  private isConnectEventExpected(eventType: Stripe.Event.Type): boolean {
    switch (eventType) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'charge.refunded':
        return true;
      default:
        return false;
    }
  }

  private async applyDomainSideEffects(
    eventType: PaymentEventType,
    context: EventContext,
  ): Promise<void> {
    if (!context.subscriptionId) {
      this.logger.debug(
        `Skipping domain side-effects for event type ${eventType} due to missing subscription context`,
      );
      return;
    }

    const statusUpdate = this.subscriptionStatusForEvent(eventType);

    switch (eventType) {
      case PaymentEventType.CHECKOUT_COMPLETED:
      case PaymentEventType.SUBSCRIPTION_CREATED:
      case PaymentEventType.SUBSCRIPTION_UPDATED:
      case PaymentEventType.INVOICE_PAID:
        await this.channelAccessService.handlePaymentSuccess(
          context.subscriptionId,
          PaymentProvider.STRIPE,
        );
        break;

      case PaymentEventType.SUBSCRIPTION_CANCELED:
        await this.channelAccessService.handlePaymentFailure(
          context.subscriptionId,
          'canceled',
        );
        break;

      case PaymentEventType.INVOICE_PAYMENT_FAILED:
        await this.channelAccessService.handlePaymentFailure(
          context.subscriptionId,
          'payment_failed',
        );
        break;

      case PaymentEventType.REFUND_CREATED:
        await this.channelAccessService.handlePaymentFailure(
          context.subscriptionId,
          'refund',
        );
        // TODO(stripe-connect): refund_application_fee must be handled explicitly
        // if Sublynk wants platform fees reversed on creator refunds.
        // Cancel any pending/approved affiliate referral on refund
        await this.cancelAffiliateReferral(context.subscriptionId);
        break;

      default:
        break;
    }

    if (statusUpdate) {
      await this.prisma.subscription.update({
        where: { id: context.subscriptionId },
        data: { status: statusUpdate },
      });
    }
  }

  private subscriptionStatusForEvent(
    eventType: PaymentEventType,
  ): SubscriptionStatus | null {
    switch (eventType) {
      case PaymentEventType.CHECKOUT_COMPLETED:
      case PaymentEventType.SUBSCRIPTION_CREATED:
      case PaymentEventType.SUBSCRIPTION_UPDATED:
      case PaymentEventType.INVOICE_PAID:
        return SubscriptionStatus.ACTIVE;
      case PaymentEventType.SUBSCRIPTION_CANCELED:
        return SubscriptionStatus.CANCELED;
      case PaymentEventType.INVOICE_PAYMENT_FAILED:
        return SubscriptionStatus.PAST_DUE;
      case PaymentEventType.REFUND_CREATED:
        return SubscriptionStatus.EXPIRED;
      default:
        return null;
    }
  }

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const organization = await this.prisma.organization.findFirst({
      where: { stripeAccountId: account.id },
    });

    if (!organization) {
      this.logger.debug(
        `No organization found for Stripe account ${account.id}, skipping account.updated`,
      );
      return;
    }

    // Update saasActive via PlatformSubscriptionService which checks both Connect and Platform subscription
    await this.platformSubscriptionService.updateSaasActive(organization.id);
  }

  /**
   * Cancel affiliate referral for a subscription (on refund or subscription cancellation)
   */
  private async cancelAffiliateReferral(subscriptionId: string): Promise<void> {
    this.logger.debug(
      `Attempting to cancel affiliate referral for subscription: ${subscriptionId}`,
    );

    try {
      const referral = await this.prisma.affiliateReferral.findUnique({
        where: { subscriptionId },
      });

      if (!referral) {
        this.logger.debug(
          `No affiliate referral found for subscription ${subscriptionId}`,
        );
        return;
      }

      this.logger.debug(
        `Found affiliate referral ${referral.id}, status=${referral.status}, commission=${referral.commissionCents} cents`,
      );

      // Already cancelled - idempotent, just skip
      if (referral.status === ConversionStatus.CANCELLED) {
        this.logger.debug(
          `Affiliate referral ${referral.id} already CANCELLED, skipping`,
        );
        return;
      }

      // Already paid - log warning but don't cancel (manual intervention needed)
      if (referral.status === ConversionStatus.PAID) {
        this.logger.warn(
          `Affiliate referral ${referral.id} is PAID - refund received but commission already paid out. Manual review required.`,
        );
        return;
      }

      const shouldDecrementPending =
        referral.status === ConversionStatus.PENDING ||
        referral.status === ConversionStatus.APPROVED;

      await this.prisma.$transaction([
        this.prisma.affiliateReferral.update({
          where: { id: referral.id },
          data: {
            status: ConversionStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        }),
        this.prisma.affiliate.update({
          where: { id: referral.affiliateId },
          data: {
            totalEarnings: { decrement: referral.commissionCents },
            ...(shouldDecrementPending && {
              pendingEarnings: { decrement: referral.commissionCents },
            }),
          },
        }),
      ]);

      this.logger.log(
        `Cancelled affiliate referral ${referral.id} for subscription ${subscriptionId}. ` +
          `Previous status: ${referral.status}, commission: ${referral.commissionCents} cents`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cancel affiliate referral for subscription ${subscriptionId}`,
        error as Error,
      );
    }
  }

  /**
   * Supported platform billing events are sent without event.account.
   * Creator direct-charge events always carry event.account.
   */
  private isPlatformEvent(event: Stripe.Event): boolean {
    if (event.account) {
      return false;
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        return true;
      default:
        return false;
    }
  }
}
