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
        `Processing platform event: ${event.type}`,
      );

      // Map event type for PaymentEvent storage
      const mappedType = this.mapEventType(event.type);
      if (!mappedType) {
        this.logger.debug(
          `Ignoring unsupported platform event type: ${event.type}`,
        );
        await this.platformSubscriptionService.handleWebhookEvent(event);
        return;
      }

      // Resolve context for platform events (metadata-based)
      const context = await this.resolvePlatformContext(event);
      if (!context) {
        this.logger.warn(
          `Unable to resolve context for platform event ${event.id} (type ${event.type}), processing webhook only`,
        );
        await this.platformSubscriptionService.handleWebhookEvent(event);
        return;
      }

      const occurredAt = new Date(
        (event.created ?? Math.floor(Date.now() / 1000)) * 1000,
      );
      const payload = JSON.parse(JSON.stringify(event)) as Prisma.JsonObject;

      // Save PaymentEvent for platform subscription
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

      // Process platform webhook side effects
      await this.platformSubscriptionService.handleWebhookEvent(event);

      // Mark event as processed
      await this.prisma.paymentEvent.update({
        where: { id: savedEvent.id },
        data: {
          processedAt: new Date(),
        },
      });

      // Audit log
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
            platform: true,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to write audit log for platform webhook ${event.id}`,
          error as Error,
        );
      }

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
        event.account ?? undefined,
      );
    }

    // Extract charge data for refund events
    let chargeData:
      | {
          chargeId: string;
          paymentIntentId?: string;
          invoiceId?: string;
          stripeSubscriptionId?: string;
        }
      | undefined;
    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      chargeData = {
        chargeId: charge.id,
        paymentIntentId:
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : undefined,
        invoiceId:
          typeof charge.invoice === 'string' ? charge.invoice : undefined,
      };

      // If invoice is available, try to get subscription ID from it
      if (chargeData.invoiceId && event.account) {
        try {
          const invoice = await this.stripe.invoices.retrieve(
            chargeData.invoiceId,
            undefined,
            { stripeAccount: event.account },
          );
          chargeData.stripeSubscriptionId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : undefined;
        } catch (error) {
          this.logger.warn(
            `Failed to retrieve invoice ${chargeData.invoiceId} for subscription lookup: ${(error as Error).message}`,
          );
        }
      }
    }

    await this.applyDomainSideEffects(mappedType, context, chargeData, event);

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

      // Backfill Stripe IDs on AffiliateReferral if missing
      // This is needed because checkout.session.completed might fire before payment is confirmed
      if (context.subscriptionId) {
        await this.backfillAffiliateStripeIds(
          context.subscriptionId,
          invoice,
          event.account ?? undefined,
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

  /**
   * Resolve context for platform subscription events (no event.account)
   * Extracts organizationId from metadata and finds corresponding PlatformSubscription
   */
  private async resolvePlatformContext(
    event: Stripe.Event,
  ): Promise<EventContext | null> {
    let organizationId: string | undefined;
    let stripeSubscriptionId: string | undefined;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        organizationId = session.metadata?.organizationId;
        stripeSubscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        organizationId = subscription.metadata?.organizationId;
        stripeSubscriptionId = subscription.id;
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        organizationId = invoice.metadata?.organizationId;
        stripeSubscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        break;
      }
      default:
        return null;
    }

    if (!organizationId) {
      this.logger.warn(
        `Platform event ${event.id} missing organizationId in metadata`,
      );
      return null;
    }

    // For platform events, we don't have a subscriptionId in the Subscription table
    // (this is a PlatformSubscription, not a customer Subscription)
    // The stripeSubscriptionId is stored in PlatformSubscription.stripeSubscriptionId
    return {
      organizationId,
      subscriptionId: undefined, // No customer subscription for platform events
    };
  }

  private async syncSubscriptionFromCheckout(
    session: Stripe.Checkout.Session,
    subscriptionId: string,
    stripeAccount?: string,
  ): Promise<void> {
    // Extract all available Stripe IDs immediately
    const stripeCheckoutSessionId = session.id;
    const stripeInvoiceId =
      typeof session.invoice === 'string' ? session.invoice : session.invoice?.id;
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    this.logger.log(
      `checkout.session.completed: sessionId=${session.id}, mode=${session.mode}, ` +
        `invoice=${stripeInvoiceId ?? 'null'}, ` +
        `subscription=${stripeSubscriptionId ?? 'null'}, ` +
        `payment_intent=${session.payment_intent ?? 'null'}, ` +
        `internalSubscriptionId=${session.metadata?.internalSubscriptionId ?? session.metadata?.subscriptionId ?? 'null'}, ` +
        `stripeAccount=${stripeAccount ?? 'null'}`,
    );

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

    // Try to resolve payment IDs (may fail for subscription mode if payment not yet confirmed)
    const resolvedIds = await this.resolveStripePaymentIds(session, stripeAccount);

    // Combine all Stripe IDs - store what we have immediately
    const stripeIds = {
      stripeCheckoutSessionId,
      stripeInvoiceId,
      stripeSubscriptionId,
      stripePaymentIntentId: resolvedIds.stripePaymentIntentId,
      stripeChargeId: resolvedIds.stripeChargeId,
      stripeAccount,
    };

    this.logger.debug(
      `Stripe IDs for AffiliateReferral: ` +
        `invoiceId=${stripeInvoiceId ?? 'null'}, ` +
        `subscriptionId=${stripeSubscriptionId ?? 'null'}, ` +
        `paymentIntentId=${stripeIds.stripePaymentIntentId ?? 'null'}, ` +
        `chargeId=${stripeIds.stripeChargeId ?? 'null'}`,
    );

    // Process affiliate referral and coupon usage from metadata
    const metadata = session.metadata ?? {};
    await this.processAffiliateAndCoupon(subscriptionId, metadata, stripeIds);
  }

  /**
   * Resolve Stripe payment IDs from checkout session
   * Handles both payment mode (direct payment_intent) and subscription mode (via invoice)
   */
  private async resolveStripePaymentIds(
    session: Stripe.Checkout.Session,
    stripeAccount?: string,
  ): Promise<{
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    stripeAccount?: string;
  }> {
    const stripeOpts = stripeAccount ? { stripeAccount } : undefined;

    // Mode payment: payment_intent is directly on the session
    if (session.mode === 'payment' && typeof session.payment_intent === 'string') {
      try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          session.payment_intent,
          { expand: ['latest_charge'] },
          stripeOpts,
        );

        const chargeId = this.extractChargeId(paymentIntent.latest_charge);

        return {
          stripePaymentIntentId: session.payment_intent,
          stripeChargeId: chargeId ?? undefined,
          stripeAccount,
        };
      } catch (error) {
        this.logger.warn(
          `Failed to retrieve PaymentIntent ${session.payment_intent}: ${(error as Error).message}`,
        );
        return {
          stripePaymentIntentId: session.payment_intent,
          stripeAccount,
        };
      }
    }

    // Mode subscription: payment_intent is on the invoice, not on the session
    if (session.mode === 'subscription' && typeof session.subscription === 'string') {
      try {
        this.logger.debug(
          `Retrieving subscription ${session.subscription} for payment IDs`,
        );

        // Retrieve subscription with expanded latest_invoice.payment_intent
        const subscription = await this.stripe.subscriptions.retrieve(
          session.subscription,
          { expand: ['latest_invoice.payment_intent'] },
          stripeOpts,
        );

        this.logger.debug(
          `Subscription retrieved: latest_invoice=${typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice?.id : subscription.latest_invoice}`,
        );

        const invoice = subscription.latest_invoice;
        if (!invoice || typeof invoice === 'string') {
          this.logger.warn(
            `Subscription ${session.subscription} has no expanded latest_invoice (got: ${typeof invoice})`,
          );
          return { stripeAccount };
        }

        const paymentIntent = invoice.payment_intent;
        this.logger.debug(
          `Invoice ${invoice.id}: payment_intent=${typeof paymentIntent === 'object' ? paymentIntent?.id : paymentIntent}, status=${invoice.status}`,
        );

        if (!paymentIntent) {
          this.logger.warn(
            `Invoice ${invoice.id} has no payment_intent (trial, free, or pending?)`,
          );
          return { stripeAccount };
        }

        const paymentIntentId =
          typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;

        // Get charge ID from payment intent - always fetch to ensure we have latest_charge
        let chargeId: string | undefined;
        try {
          const pi = await this.stripe.paymentIntents.retrieve(
            paymentIntentId,
            { expand: ['latest_charge'] },
            stripeOpts,
          );
          this.logger.debug(
            `PaymentIntent ${paymentIntentId}: status=${pi.status}, latest_charge=${typeof pi.latest_charge === 'object' ? pi.latest_charge?.id : pi.latest_charge}`,
          );
          chargeId = this.extractChargeId(pi.latest_charge) ?? undefined;
        } catch (piError) {
          this.logger.warn(
            `Failed to retrieve PaymentIntent ${paymentIntentId}: ${(piError as Error).message}`,
          );
        }

        return {
          stripePaymentIntentId: paymentIntentId,
          stripeChargeId: chargeId,
          stripeAccount,
        };
      } catch (error) {
        this.logger.warn(
          `Failed to retrieve subscription ${session.subscription}: ${(error as Error).message}`,
        );
        return { stripeAccount };
      }
    }

    this.logger.warn(
      `Could not resolve Stripe payment IDs for session ${session.id} (mode=${session.mode})`,
    );
    return { stripeAccount };
  }

  /**
   * Extract charge ID from a Stripe charge reference (string or object)
   */
  private extractChargeId(
    charge: string | Stripe.Charge | null | undefined,
  ): string | null {
    if (!charge) return null;
    if (typeof charge === 'string') return charge;
    return charge.id;
  }

  /**
   * Backfill Stripe IDs on AffiliateReferral when invoice.payment_succeeded fires
   * This is needed because checkout.session.completed might fire before payment is confirmed
   */
  private async backfillAffiliateStripeIds(
    subscriptionId: string,
    invoice: Stripe.Invoice,
    stripeAccount?: string,
  ): Promise<void> {
    try {
      // Check if there's an AffiliateReferral missing Stripe IDs
      const referral = await this.prisma.affiliateReferral.findUnique({
        where: { subscriptionId },
        select: {
          id: true,
          stripeInvoiceId: true,
          stripeSubscriptionId: true,
          stripePaymentIntentId: true,
          stripeChargeId: true,
        },
      });

      if (!referral) {
        return; // No affiliate referral for this subscription
      }

      // Extract invoice ID and subscription ID from the event
      const invoiceId = invoice.id;
      const stripeSubscriptionId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

      // Skip if all IDs are already set
      if (
        referral.stripeInvoiceId &&
        referral.stripeSubscriptionId &&
        referral.stripePaymentIntentId &&
        referral.stripeChargeId
      ) {
        this.logger.debug(
          `AffiliateReferral ${referral.id} already has all Stripe IDs, skipping backfill`,
        );
        return;
      }

      // Get payment_intent from invoice
      const paymentIntentId =
        typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent
          : invoice.payment_intent?.id;

      // Retrieve PaymentIntent to get latest_charge (if we have payment_intent)
      const stripeOpts = stripeAccount ? { stripeAccount } : undefined;
      let chargeId: string | null = null;

      if (paymentIntentId) {
        try {
          const pi = await this.stripe.paymentIntents.retrieve(
            paymentIntentId,
            { expand: ['latest_charge'] },
            stripeOpts,
          );
          chargeId = this.extractChargeId(pi.latest_charge);

          this.logger.debug(
            `Backfill: PaymentIntent ${paymentIntentId} has latest_charge=${chargeId}`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to retrieve PaymentIntent ${paymentIntentId} for backfill: ${(error as Error).message}`,
          );
        }
      }

      // Update AffiliateReferral with all missing Stripe IDs
      const updateData: {
        stripeInvoiceId?: string;
        stripeSubscriptionId?: string;
        stripePaymentIntentId?: string;
        stripeChargeId?: string;
      } = {};

      if (!referral.stripeInvoiceId && invoiceId) {
        updateData.stripeInvoiceId = invoiceId;
      }
      if (!referral.stripeSubscriptionId && stripeSubscriptionId) {
        updateData.stripeSubscriptionId = stripeSubscriptionId;
      }
      if (!referral.stripePaymentIntentId && paymentIntentId) {
        updateData.stripePaymentIntentId = paymentIntentId;
      }
      if (!referral.stripeChargeId && chargeId) {
        updateData.stripeChargeId = chargeId;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.affiliateReferral.update({
          where: { id: referral.id },
          data: updateData,
        });

        this.logger.log(
          `Backfilled AffiliateReferral ${referral.id}: ` +
            `stripeInvoiceId=${updateData.stripeInvoiceId ?? 'unchanged'}, ` +
            `stripeSubscriptionId=${updateData.stripeSubscriptionId ?? 'unchanged'}, ` +
            `stripePaymentIntentId=${updateData.stripePaymentIntentId ?? 'unchanged'}, ` +
            `stripeChargeId=${updateData.stripeChargeId ?? 'unchanged'}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to backfill Stripe IDs for subscription ${subscriptionId}`,
        error as Error,
      );
    }
  }

  private async processAffiliateAndCoupon(
    subscriptionId: string,
    metadata: Record<string, string>,
    stripeIds?: {
      stripeCheckoutSessionId?: string;
      stripeInvoiceId?: string;
      stripeSubscriptionId?: string;
      stripePaymentIntentId?: string;
      stripeChargeId?: string;
      stripeAccount?: string;
    },
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

            // Store all available Stripe IDs for refund matching
            // For subscription mode: invoiceId is the most reliable link
            const stripeCheckoutSessionId = stripeIds?.stripeCheckoutSessionId ?? null;
            const stripeInvoiceId = stripeIds?.stripeInvoiceId ?? null;
            const stripeSubscriptionId = stripeIds?.stripeSubscriptionId ?? null;
            const stripePaymentIntentId = stripeIds?.stripePaymentIntentId ?? null;
            const stripeChargeId = stripeIds?.stripeChargeId ?? null;

            // Log what we're storing for debugging
            this.logger.debug(
              `Creating AffiliateReferral with Stripe IDs: ` +
                `checkoutSessionId=${stripeCheckoutSessionId ?? 'null'}, ` +
                `invoiceId=${stripeInvoiceId ?? 'null'}, ` +
                `subscriptionId=${stripeSubscriptionId ?? 'null'}, ` +
                `paymentIntentId=${stripePaymentIntentId ?? 'null'}, ` +
                `chargeId=${stripeChargeId ?? 'null'}`,
            );

            // For subscriptions, invoiceId is the key link - payment IDs come later via backfill
            if (!stripeInvoiceId && !stripePaymentIntentId && !stripeChargeId) {
              this.logger.warn(
                `AffiliateReferral created without any Stripe IDs; refunds may not be matched. ` +
                  `subscriptionId=${subscriptionId}, affiliateId=${affiliateId}`,
              );
            }

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
                  stripeCheckoutSessionId,
                  stripeInvoiceId,
                  stripeSubscriptionId,
                  stripePaymentIntentId,
                  stripeChargeId,
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

            this.logger.log(
              `AffiliateReferral created: subscriptionId=${subscriptionId}, ` +
                `commission=${commissionCents} cents, status=PENDING, ` +
                `stripeInvoiceId=${stripeInvoiceId ?? 'null'}, ` +
                `stripeSubscriptionId=${stripeSubscriptionId ?? 'null'}, ` +
                `stripePaymentIntentId=${stripePaymentIntentId ?? 'null'}, ` +
                `stripeChargeId=${stripeChargeId ?? 'null'}`,
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
    chargeData?: {
      chargeId: string;
      paymentIntentId?: string;
      invoiceId?: string;
      stripeSubscriptionId?: string;
    },
    stripeEvent?: Stripe.Event,
  ): Promise<void> {
    // For refunds, we can still cancel affiliate referral even without subscriptionId
    // by using Stripe IDs (chargeId, paymentIntentId)
    if (eventType === PaymentEventType.REFUND_CREATED) {
      await this.handleRefundSideEffects(context, chargeData);
      return;
    }

    if (!context.subscriptionId) {
      this.logger.debug(
        `Skipping domain side-effects for event type ${eventType} due to missing subscription context`,
      );
      return;
    }

    const statusUpdate = this.subscriptionStatusForEvent(
      eventType,
      stripeEvent,
    );

    if (statusUpdate) {
      await this.prisma.subscription.update({
        where: { id: context.subscriptionId },
        data: { status: statusUpdate },
      });
    }

    switch (eventType) {
      case PaymentEventType.CHECKOUT_COMPLETED:
      case PaymentEventType.SUBSCRIPTION_CREATED:
      case PaymentEventType.SUBSCRIPTION_UPDATED:
      case PaymentEventType.INVOICE_PAID:
        if (this.isAccessGrantAuthorized(stripeEvent)) {
          await this.channelAccessService.handlePaymentSuccess(
            context.subscriptionId,
            PaymentProvider.STRIPE,
          );
        } else {
          this.logger.warn(
            `Stripe event ${stripeEvent?.id ?? 'unknown'} did not prove a paid or trialing state; access grant skipped`,
          );
        }
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

      default:
        break;
    }

  }

  /**
   * Handle refund side effects - supports both subscription-based and Stripe ID-based lookup
   */
  private async handleRefundSideEffects(
    context: EventContext,
    chargeData?: {
      chargeId: string;
      paymentIntentId?: string;
      invoiceId?: string;
      stripeSubscriptionId?: string;
    },
  ): Promise<void> {
    this.logger.debug(
      `Refund received: subscriptionId=${context.subscriptionId ?? 'null'}, ` +
        `chargeId=${chargeData?.chargeId ?? 'null'}, ` +
        `paymentIntentId=${chargeData?.paymentIntentId ?? 'null'}, ` +
        `invoiceId=${chargeData?.invoiceId ?? 'null'}, ` +
        `stripeSubscriptionId=${chargeData?.stripeSubscriptionId ?? 'null'}`,
    );

    // If we have subscriptionId, use the subscription-based flow
    if (context.subscriptionId) {
      await this.channelAccessService.handlePaymentFailure(
        context.subscriptionId,
        'refund',
      );

      await this.prisma.subscription.update({
        where: { id: context.subscriptionId },
        data: { status: SubscriptionStatus.EXPIRED },
      });

      // TODO(stripe-connect): refund_application_fee must be handled explicitly
      // if Sublynk wants platform fees reversed on creator refunds.
      await this.cancelAffiliateReferral(context.subscriptionId);
      return;
    }

    // No subscriptionId - try to find affiliate referral by Stripe IDs
    if (chargeData?.chargeId) {
      this.logger.debug(
        `No subscriptionId for refund, attempting Stripe ID lookup ` +
          `(chargeId, paymentIntentId, invoiceId, stripeSubscriptionId)`,
      );
      await this.cancelAffiliateReferralByStripeIds(
        chargeData.chargeId,
        chargeData.paymentIntentId,
        chargeData.invoiceId,
        chargeData.stripeSubscriptionId,
      );
    } else {
      this.logger.warn(
        `Refund received but no subscriptionId or chargeId available for affiliate cancellation`,
      );
    }
  }

  private subscriptionStatusForEvent(
    eventType: PaymentEventType,
    stripeEvent?: Stripe.Event,
  ): SubscriptionStatus | null {
    switch (eventType) {
      case PaymentEventType.CHECKOUT_COMPLETED: {
        if (stripeEvent?.type !== 'checkout.session.completed') return null;
        const paymentStatus = stripeEvent.data.object.payment_status;
        if (paymentStatus === 'paid') return SubscriptionStatus.ACTIVE;
        if (paymentStatus === 'no_payment_required') {
          return SubscriptionStatus.TRIALING;
        }
        return SubscriptionStatus.INCOMPLETE;
      }
      case PaymentEventType.SUBSCRIPTION_CREATED:
      case PaymentEventType.SUBSCRIPTION_UPDATED: {
        if (
          stripeEvent?.type !== 'customer.subscription.created' &&
          stripeEvent?.type !== 'customer.subscription.updated'
        ) {
          return null;
        }
        switch (stripeEvent.data.object.status) {
          case 'active':
            return SubscriptionStatus.ACTIVE;
          case 'trialing':
            return SubscriptionStatus.TRIALING;
          case 'past_due':
          case 'unpaid':
            return SubscriptionStatus.PAST_DUE;
          case 'canceled':
            return SubscriptionStatus.CANCELED;
          case 'incomplete':
          case 'incomplete_expired':
            return SubscriptionStatus.INCOMPLETE;
          default:
            return SubscriptionStatus.EXPIRED;
        }
      }
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

  private isAccessGrantAuthorized(event?: Stripe.Event): boolean {
    if (!event) return false;

    switch (event.type) {
      case 'checkout.session.completed':
        return (
          event.data.object.payment_status === 'paid' ||
          event.data.object.payment_status === 'no_payment_required'
        );
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return (
          event.data.object.status === 'active' ||
          event.data.object.status === 'trialing'
        );
      case 'invoice.payment_succeeded':
        return event.data.object.status === 'paid';
      default:
        return false;
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

      await this.executeCancelReferral(referral, `subscription ${subscriptionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to cancel affiliate referral for subscription ${subscriptionId}`,
        error as Error,
      );
    }
  }

  /**
   * Cancel affiliate referral by Stripe IDs (charge.id, payment_intent, invoice, or subscription)
   * Used for refunds when subscription context is not available (one-time payments)
   * Lookup order: chargeId -> paymentIntentId -> invoiceId -> stripeSubscriptionId
   */
  private async cancelAffiliateReferralByStripeIds(
    chargeId: string,
    paymentIntentId?: string,
    invoiceId?: string,
    stripeSubscriptionId?: string,
  ): Promise<void> {
    this.logger.debug(
      `Searching AffiliateReferral by Stripe IDs: chargeId=${chargeId}, ` +
        `paymentIntentId=${paymentIntentId ?? 'null'}, ` +
        `invoiceId=${invoiceId ?? 'null'}, ` +
        `stripeSubscriptionId=${stripeSubscriptionId ?? 'null'}`,
    );

    try {
      // Try to find by stripeChargeId first
      let referral = await this.prisma.affiliateReferral.findFirst({
        where: { stripeChargeId: chargeId },
      });

      // If not found, try by stripePaymentIntentId
      if (!referral && paymentIntentId) {
        referral = await this.prisma.affiliateReferral.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });
      }

      // If not found, try by stripeInvoiceId (most reliable for subscription mode)
      if (!referral && invoiceId) {
        referral = await this.prisma.affiliateReferral.findFirst({
          where: { stripeInvoiceId: invoiceId },
        });
      }

      // If not found, try by stripeSubscriptionId
      if (!referral && stripeSubscriptionId) {
        referral = await this.prisma.affiliateReferral.findFirst({
          where: { stripeSubscriptionId: stripeSubscriptionId },
        });
      }

      if (!referral) {
        this.logger.debug(
          `No AffiliateReferral found for chargeId=${chargeId}, ` +
            `paymentIntentId=${paymentIntentId ?? 'null'}, ` +
            `invoiceId=${invoiceId ?? 'null'}, ` +
            `stripeSubscriptionId=${stripeSubscriptionId ?? 'null'}`,
        );
        return;
      }

      this.logger.debug(
        `Found AffiliateReferral ${referral.id} by Stripe IDs`,
      );

      await this.executeCancelReferral(
        referral,
        `chargeId=${chargeId}, paymentIntentId=${paymentIntentId ?? 'null'}, invoiceId=${invoiceId ?? 'null'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cancel affiliate referral by Stripe IDs: chargeId=${chargeId}, ` +
          `paymentIntentId=${paymentIntentId ?? 'null'}, invoiceId=${invoiceId ?? 'null'}`,
        error as Error,
      );
    }
  }

  /**
   * Execute the actual cancellation of an affiliate referral
   * Decrements totalEarnings and pendingEarnings on the Affiliate record
   */
  private async executeCancelReferral(
    referral: {
      id: string;
      affiliateId: string;
      status: ConversionStatus;
      commissionCents: number;
    },
    lookupContext: string,
  ): Promise<void> {
    this.logger.debug(
      `executeCancelReferral: referralId=${referral.id}, affiliateId=${referral.affiliateId}, ` +
        `status=${referral.status}, commissionCents=${referral.commissionCents}`,
    );

    // Already cancelled - idempotent, just skip (don't decrement twice!)
    if (referral.status === ConversionStatus.CANCELLED) {
      this.logger.debug(
        `Affiliate referral ${referral.id} already CANCELLED, skipping decrement`,
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

    // PENDING or APPROVED: decrement both totalEarnings and pendingEarnings
    const shouldDecrementPending =
      referral.status === ConversionStatus.PENDING ||
      referral.status === ConversionStatus.APPROVED;

    const decrementAmount = referral.commissionCents;

    // Use interactive transaction for proper error handling
    await this.prisma.$transaction(async (tx) => {
      // 1. Update referral status to CANCELLED
      await tx.affiliateReferral.update({
        where: { id: referral.id },
        data: {
          status: ConversionStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      this.logger.debug(
        `Referral ${referral.id} status updated to CANCELLED`,
      );

      // 2. Decrement affiliate earnings
      // Use Math.max equivalent via raw SQL or careful update to avoid negative values
      const affiliateUpdate = await tx.affiliate.update({
        where: { id: referral.affiliateId },
        data: {
          totalEarnings: { decrement: decrementAmount },
          ...(shouldDecrementPending && {
            pendingEarnings: { decrement: decrementAmount },
          }),
        },
      });

      this.logger.debug(
        `Affiliate ${referral.affiliateId} earnings decremented by ${decrementAmount} cents. ` +
          `New values: totalEarnings=${affiliateUpdate.totalEarnings}, pendingEarnings=${affiliateUpdate.pendingEarnings}`,
      );
    });

    this.logger.log(
      `Cancelled affiliate referral ${referral.id} (${lookupContext}). ` +
        `Previous status: ${referral.status}, commission decremented: ${decrementAmount} cents`,
    );
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
