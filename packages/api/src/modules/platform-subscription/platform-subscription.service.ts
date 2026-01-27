import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformSubscriptionStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  PlatformPlanResponse,
  PlatformSubscriptionResponse,
} from './platform-subscription.schema';

@Injectable()
export class PlatformSubscriptionService {
  private readonly logger = new Logger(PlatformSubscriptionService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Get all active platform plans available for subscription
   */
  async getPlans(): Promise<PlatformPlanResponse[]> {
    const plans = await this.prisma.platformPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      priceCents: plan.priceCents,
      currency: plan.currency,
      interval: plan.interval,
      trialPeriodDays: plan.trialPeriodDays,
      features: plan.features as Record<string, unknown> | null,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    }));
  }

  /**
   * Get the current platform subscription for an organization
   */
  async getSubscription(
    organizationId: string,
  ): Promise<PlatformSubscriptionResponse | null> {
    const subscription = await this.prisma.platformSubscription.findUnique({
      where: { organizationId },
      include: { platformPlan: true },
    });

    if (!subscription) {
      return null;
    }

    const metadata = subscription.metadata as Record<string, unknown> | null;

    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      status: subscription.status,
      plan: subscription.platformPlan
        ? {
            id: subscription.platformPlan.id,
            name: subscription.platformPlan.name,
            displayName: subscription.platformPlan.displayName,
            priceCents: subscription.platformPlan.priceCents,
            currency: subscription.platformPlan.currency,
            interval: subscription.platformPlan.interval,
            trialPeriodDays: subscription.platformPlan.trialPeriodDays,
            features: subscription.platformPlan.features as Record<
              string,
              unknown
            > | null,
            isActive: subscription.platformPlan.isActive,
            sortOrder: subscription.platformPlan.sortOrder,
          }
        : null,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      canceledAt: subscription.canceledAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      graceUntil: subscription.graceUntil,
      isGrandfathered: metadata?.grandfathered === true,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Create a Stripe checkout session for platform subscription
   */
  async createCheckoutSession(
    organizationId: string,
    planName: string,
  ): Promise<{ url: string }> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { platformSubscription: true },
    });

    if (!organization) {
      throw new NotFoundException('Organisation introuvable');
    }

    // Check if already has an active subscription
    if (organization.platformSubscription) {
      const status = organization.platformSubscription.status;
      if (
        status === PlatformSubscriptionStatus.ACTIVE ||
        status === PlatformSubscriptionStatus.TRIALING
      ) {
        throw new ForbiddenException('Un abonnement plateforme est déjà actif');
      }
    }

    // Find the plan
    const plan = await this.prisma.platformPlan.findUnique({
      where: { name: planName },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan introuvable ou inactif');
    }

    // Get or create Stripe customer for the organization
    let stripeCustomerId = organization.platformSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: organization.billingEmail,
        metadata: {
          organizationId: organization.id,
          type: 'platform',
        },
      });
      stripeCustomerId = customer.id;
    }

    // Get or create Stripe Price
    let stripePriceId = plan.stripePriceId;

    if (!stripePriceId) {
      // Create price on-the-fly if not configured
      const price = await this.stripe.prices.create({
        currency: plan.currency.toLowerCase(),
        unit_amount: plan.priceCents,
        recurring: {
          interval: 'month',
        },
        product_data: {
          name: `Solynk ${plan.displayName}`,
          metadata: {
            platformPlanId: plan.id,
            type: 'platform',
          },
        },
        metadata: {
          platformPlanId: plan.id,
          type: 'platform',
        },
      });

      stripePriceId = price.id;

      // Save price ID for future use
      await this.prisma.platformPlan.update({
        where: { id: plan.id },
        data: { stripePriceId },
      });
    }

    const successUrl = this.config.get<string>('PLATFORM_CHECKOUT_SUCCESS_URL');
    const cancelUrl = this.config.get<string>('PLATFORM_CHECKOUT_CANCEL_URL');

    if (!successUrl || !cancelUrl) {
      throw new BadRequestException(
        'Platform checkout URLs are not configured',
      );
    }

    const trialPeriodDays =
      plan.trialPeriodDays ??
      this.config.get<number>('PLATFORM_TRIAL_DAYS') ??
      14;

    // Create checkout session (direct Stripe, not Connect)
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        organizationId: organization.id,
        platformPlanId: plan.id,
        type: 'platform',
      },
      subscription_data: {
        trial_period_days: trialPeriodDays,
        metadata: {
          organizationId: organization.id,
          platformPlanId: plan.id,
          type: 'platform',
        },
      },
    });

    // Create or update platform subscription in INCOMPLETE state
    await this.prisma.platformSubscription.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        platformPlanId: plan.id,
        status: PlatformSubscriptionStatus.INCOMPLETE,
        stripeCustomerId,
        metadata: {
          checkoutSessionId: session.id,
        },
      },
      update: {
        platformPlanId: plan.id,
        status: PlatformSubscriptionStatus.INCOMPLETE,
        stripeCustomerId,
        metadata: {
          checkoutSessionId: session.id,
        },
      },
    });

    if (!session.url) {
      throw new BadRequestException('Stripe checkout session invalide');
    }

    return { url: session.url };
  }

  /**
   * Create a Stripe Customer Portal link for managing subscription
   */
  async createPortalSession(organizationId: string): Promise<{ url: string }> {
    const subscription = await this.prisma.platformSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      throw new NotFoundException('Aucun abonnement plateforme trouvé');
    }

    const metadata = subscription.metadata as Record<string, unknown> | null;
    if (metadata?.grandfathered === true) {
      throw new ForbiddenException(
        'Les comptes grandfathered ne peuvent pas accéder au portail',
      );
    }

    const returnUrl =
      this.config.get<string>('PLATFORM_CHECKOUT_SUCCESS_URL') ??
      this.config.get<string>('FRONTEND_URL');

    if (!returnUrl) {
      throw new BadRequestException('Return URL not configured');
    }

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };
  }

  /**
   * Cancel subscription at end of period
   */
  async cancelSubscription(organizationId: string): Promise<void> {
    const subscription = await this.prisma.platformSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      throw new NotFoundException('Aucun abonnement plateforme trouvé');
    }

    const metadata = subscription.metadata as Record<string, unknown> | null;
    if (metadata?.grandfathered === true) {
      throw new ForbiddenException(
        'Les comptes grandfathered ne peuvent pas être annulés',
      );
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException("L'abonnement n'est pas lié à Stripe");
    }

    // Cancel at period end via Stripe
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await this.prisma.platformSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    this.logger.log(
      `Platform subscription ${subscription.id} scheduled for cancellation`,
    );
  }

  /**
   * Handle Stripe webhook events for platform subscriptions
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.debug(`Processing platform webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        this.logger.debug(
          `Ignoring unhandled platform event type: ${event.type}`,
        );
    }
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    const platformPlanId = session.metadata?.platformPlanId;

    if (!organizationId || !platformPlanId) {
      this.logger.warn('Checkout session missing required metadata');
      return;
    }

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!stripeSubscriptionId) {
      this.logger.warn('Checkout session missing subscription ID');
      return;
    }

    // Retrieve subscription details
    const stripeSubscription =
      await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    await this.prisma.platformSubscription.update({
      where: { organizationId },
      data: {
        stripeSubscriptionId,
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        trialEndsAt: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });

    // Update saasActive on organization
    await this.updateSaasActive(organizationId);

    this.logger.log(
      `Platform subscription activated for organization ${organizationId}`,
    );
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;

    if (!organizationId) {
      // Try to find by stripeSubscriptionId
      const platformSub = await this.prisma.platformSubscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!platformSub) {
        this.logger.debug(
          `No platform subscription found for Stripe subscription ${subscription.id}`,
        );
        return;
      }

      await this.updateSubscriptionFromStripe(
        platformSub.organizationId,
        subscription,
      );
      return;
    }

    await this.updateSubscriptionFromStripe(organizationId, subscription);
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const platformSub = await this.prisma.platformSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!platformSub) {
      this.logger.debug(
        `No platform subscription found for deleted Stripe subscription ${subscription.id}`,
      );
      return;
    }

    const gracePeriodDays =
      this.config.get<number>('PLATFORM_GRACE_PERIOD_DAYS') ?? 7;
    const graceUntil = new Date();
    graceUntil.setDate(graceUntil.getDate() + gracePeriodDays);

    await this.prisma.platformSubscription.update({
      where: { id: platformSub.id },
      data: {
        status: PlatformSubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        graceUntil,
      },
    });

    // Update saasActive (still active during grace period)
    await this.updateSaasActive(platformSub.organizationId);

    this.logger.log(
      `Platform subscription ${platformSub.id} canceled with grace until ${graceUntil.toISOString()}`,
    );
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const platformSub = await this.prisma.platformSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!platformSub) {
      return;
    }

    // Mark as active (in case it was past_due)
    if (platformSub.status === PlatformSubscriptionStatus.PAST_DUE) {
      await this.prisma.platformSubscription.update({
        where: { id: platformSub.id },
        data: {
          status: PlatformSubscriptionStatus.ACTIVE,
          graceUntil: null,
        },
      });

      await this.updateSaasActive(platformSub.organizationId);
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const platformSub = await this.prisma.platformSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!platformSub) {
      return;
    }

    const gracePeriodDays =
      this.config.get<number>('PLATFORM_GRACE_PERIOD_DAYS') ?? 7;
    const graceUntil = new Date();
    graceUntil.setDate(graceUntil.getDate() + gracePeriodDays);

    await this.prisma.platformSubscription.update({
      where: { id: platformSub.id },
      data: {
        status: PlatformSubscriptionStatus.PAST_DUE,
        graceUntil,
      },
    });

    this.logger.warn(
      `Platform subscription ${platformSub.id} payment failed, grace until ${graceUntil.toISOString()}`,
    );
  }

  private async updateSubscriptionFromStripe(
    organizationId: string,
    subscription: Stripe.Subscription,
  ): Promise<void> {
    await this.prisma.platformSubscription.update({
      where: { organizationId },
      data: {
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      },
    });

    await this.updateSaasActive(organizationId);
  }

  /**
   * Update organization's saasActive based on platform subscription AND Stripe Connect status
   */
  async updateSaasActive(organizationId: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { platformSubscription: true },
    });

    if (!organization) {
      return;
    }

    // Check platform subscription status
    const sub = organization.platformSubscription;
    const isPlatformActive = Boolean(
      sub &&
        (sub.status === PlatformSubscriptionStatus.ACTIVE ||
          sub.status === PlatformSubscriptionStatus.TRIALING ||
          // Allow during grace period
          (sub.graceUntil && sub.graceUntil > new Date())),
    );

    // Check if grandfathered (always active)
    const metadata = sub?.metadata as Record<string, unknown> | null;
    const isGrandfathered = metadata?.grandfathered === true;

    // Check Stripe Connect status
    let isConnectReady = false;
    if (organization.stripeAccountId) {
      try {
        const account = await this.stripe.accounts.retrieve(
          organization.stripeAccountId,
        );
        isConnectReady = Boolean(
          account.charges_enabled && account.details_submitted,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to retrieve Stripe account for org ${organizationId}`,
          error,
        );
      }
    }

    // saasActive = platform subscription active AND Stripe Connect ready
    // OR grandfathered (for early adopters)
    const newSaasActive = Boolean(
      isGrandfathered || (isPlatformActive && isConnectReady),
    );

    if (organization.saasActive !== newSaasActive) {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { saasActive: newSaasActive },
      });

      this.logger.log(
        `Organization ${organizationId} saasActive updated to ${newSaasActive} ` +
          `(platformActive: ${isPlatformActive}, connectReady: ${isConnectReady}, grandfathered: ${isGrandfathered})`,
      );
    }
  }

  private mapStripeStatus(
    status: Stripe.Subscription.Status,
  ): PlatformSubscriptionStatus {
    switch (status) {
      case 'trialing':
        return PlatformSubscriptionStatus.TRIALING;
      case 'active':
        return PlatformSubscriptionStatus.ACTIVE;
      case 'past_due':
        return PlatformSubscriptionStatus.PAST_DUE;
      case 'canceled':
        return PlatformSubscriptionStatus.CANCELED;
      case 'incomplete':
      case 'incomplete_expired':
        return PlatformSubscriptionStatus.INCOMPLETE;
      case 'unpaid':
      case 'paused':
      default:
        return PlatformSubscriptionStatus.EXPIRED;
    }
  }
}
