import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  PaymentEventType,
  PaymentProvider,
  AuditActorType,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { AuditLogService } from '../audit-log/audit-log.service';

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
  ) {
    const apiKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-06-20',
    });
  }

  async handleWebhook(signature: string, request: StripeRawBodyRequest): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body for Stripe signature verification');
    }

    let event: Stripe.Event;
    try {
      const bodyToVerify =
        typeof rawBody === 'string' ? rawBody : (rawBody as Buffer);
      event = this.stripe.webhooks.constructEvent(bodyToVerify, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Stripe signature verification failed', error as Error);
      throw new BadRequestException('Invalid Stripe signature');
    }

    await this.processEvent(event);
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    // Handle Connect account events separately (no PaymentEventType mapping)
    if (event.type === 'account.updated') {
      await this.handleAccountUpdated(event.data.object as Stripe.Account);
      return;
    }

    const mappedType = this.mapEventType(event.type);
    if (!mappedType) {
      this.logger.debug(`Ignoring unsupported Stripe event type: ${event.type}`);
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

    const occurredAt = new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000);
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
      this.logger.debug(`Stripe event ${event.id} already processed, skipping domain side-effects`);
      return;
    }

    if (
      event.type === 'checkout.session.completed' &&
      context.subscriptionId
    ) {
      await this.syncSubscriptionFromCheckout(
        event.data.object as Stripe.Checkout.Session,
        context.subscriptionId,
      );
    }

    await this.applyDomainSideEffects(mappedType, context);

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

  private async resolveContext(event: Stripe.Event): Promise<EventContext | null> {
    const accountContext = await this.contextFromStripeAccount(event.account);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : undefined;
        if (subscriptionId) {
          const context = await this.contextFromSubscription(subscriptionId);
          if (context) {
            return context;
          }
        }

        const metadataContext = await this.contextFromMetadata(session.metadata ?? undefined);
        return metadataContext ?? accountContext;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const context = await this.contextFromSubscription(subscription.id);
        return context ?? accountContext;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
        if (!subscriptionId) {
          const metadataContext = await this.contextFromMetadata(invoice.metadata ?? undefined);
          return metadataContext ?? accountContext;
        }
        const context = await this.contextFromSubscription(subscriptionId);
        return context ?? accountContext;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const metadataContext = await this.contextFromMetadata(charge.metadata ?? undefined);
        if (metadataContext) {
          return metadataContext;
        }

        const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : undefined;
        if (!invoiceId) {
          return null;
        }

        try {
          const invoice = await this.stripe.invoices.retrieve(
            invoiceId,
            undefined,
            event.account ? { stripeAccount: event.account } : undefined,
          );
          const subscriptionId =
            typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
          if (!subscriptionId) {
            return accountContext;
          }
          const context = await this.contextFromSubscription(subscriptionId);
          return context ?? accountContext;
        } catch (error) {
          this.logger.warn(
            `Failed to retrieve invoice ${invoiceId} for charge ${charge.id}: ${(error as Error).message}`,
          );
          return accountContext;
        }
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

    if (Object.keys(update).length === 0) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: update,
    });
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

    const isReady = Boolean(
      account.charges_enabled && account.details_submitted,
    );

    if (organization.saasActive !== isReady) {
      await this.prisma.organization.update({
        where: { id: organization.id },
        data: { saasActive: isReady },
      });

      this.logger.log(
        `Organization ${organization.id} saasActive updated to ${isReady} based on Stripe Connect status`,
      );
    }
  }
}
