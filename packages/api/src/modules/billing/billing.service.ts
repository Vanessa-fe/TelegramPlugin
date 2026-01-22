import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlanInterval,
  ProductStatus,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCheckoutDto } from './billing.schema';

type StripeStatus = {
  saasActive: boolean;
  connected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
};

@Injectable()
export class BillingService {
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

  async getStripeStatus(organizationId: string): Promise<StripeStatus> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organisation introuvable');
    }

    if (!organization.stripeAccountId) {
      return {
        saasActive: organization.saasActive,
        connected: false,
      };
    }

    const account = await this.stripe.accounts.retrieve(
      organization.stripeAccountId,
    );

    return {
      saasActive: organization.saasActive,
      connected: true,
      accountId: organization.stripeAccountId,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
    };
  }

  async createStripeConnectLink(organizationId: string): Promise<{ url: string }> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organisation introuvable');
    }

    let accountId = organization.stripeAccountId;

    if (!accountId) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email: organization.billingEmail,
        metadata: {
          organizationId: organization.id,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await this.prisma.organization.update({
        where: { id: organization.id },
        data: { stripeAccountId: accountId },
      });
    }

    const refreshUrl = this.config.get<string>('STRIPE_CONNECT_REFRESH_URL');
    const returnUrl = this.config.get<string>('STRIPE_CONNECT_RETURN_URL');

    if (!refreshUrl || !returnUrl) {
      throw new BadRequestException(
        'Stripe Connect URLs are not configured',
      );
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  async createStripeLoginLink(organizationId: string): Promise<{ url: string }> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organisation introuvable');
    }

    if (!organization.stripeAccountId) {
      throw new BadRequestException('Compte Stripe non connecté');
    }

    const stripeAccount = await this.stripe.accounts.retrieve(
      organization.stripeAccountId,
    );
    if (!stripeAccount.charges_enabled) {
      throw new ForbiddenException(
        "Compte Stripe incomplet, finalisez l'onboarding",
      );
    }

    const link = await this.stripe.accounts.createLoginLink(
      organization.stripeAccountId,
    );

    return { url: link.url };
  }

  async createCheckoutSession(
    payload: CreateCheckoutDto,
  ): Promise<{ url: string; subscriptionId: string }> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: payload.planId },
      include: {
        product: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!plan || !plan.product?.organization) {
      throw new NotFoundException('Plan introuvable');
    }

    if (!plan.isActive || plan.product.status !== ProductStatus.ACTIVE) {
      throw new ForbiddenException('Plan non disponible');
    }

    const organization = plan.product.organization;

    if (!organization.saasActive) {
      throw new ForbiddenException('Abonnement SaaS inactif');
    }

    if (!organization.stripeAccountId) {
      throw new BadRequestException('Compte Stripe non connecté');
    }
    const stripeAccount = await this.stripe.accounts.retrieve(
      organization.stripeAccountId,
    );
    if (!stripeAccount.charges_enabled) {
      throw new ForbiddenException(
        "Compte Stripe incomplet, finalisez l'onboarding",
      );
    }

    const { customer } = payload;
    const email = customer.email?.toLowerCase();
    const telegramUserId = customer.telegramUserId?.trim();
    const telegramUsername = customer.telegramUsername?.toLowerCase();

    const customerFilters: Prisma.CustomerWhereInput[] = [];
    if (email) {
      customerFilters.push({ email });
    }
    if (telegramUserId) {
      customerFilters.push({ telegramUserId });
    }
    if (customerFilters.length === 0) {
      throw new BadRequestException('Client non identifié');
    }

    const customerMatch = await this.prisma.customer.findFirst({
      where: {
        organizationId: organization.id,
        OR: customerFilters,
      },
    });

    const storedCustomer =
      customerMatch ??
      (await this.prisma.customer.create({
        data: {
          organizationId: organization.id,
          email,
          displayName: customer.displayName,
          telegramUserId,
          telegramUsername,
        },
      }));

    if (customerMatch) {
      const updateData: Prisma.CustomerUpdateInput = {};

      if (email && !customerMatch.email) {
        updateData.email = email;
      }
      if (customer.displayName && !customerMatch.displayName) {
        updateData.displayName = customer.displayName;
      }
      if (telegramUserId && !customerMatch.telegramUserId) {
        updateData.telegramUserId = telegramUserId;
      }
      if (telegramUsername && !customerMatch.telegramUsername) {
        updateData.telegramUsername = telegramUsername;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.customer.update({
          where: { id: customerMatch.id },
          data: updateData,
        });
      }
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId: organization.id,
        customerId: storedCustomer.id,
        planId: plan.id,
        status: SubscriptionStatus.INCOMPLETE,
        metadata: {
          checkoutMode:
            plan.interval === PlanInterval.ONE_TIME ? 'payment' : 'subscription',
        },
      },
    });

    const quantity = payload.quantity ?? 1;
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity,
      price_data: {
        currency: plan.currency.toLowerCase(),
        product_data: {
          name: plan.name,
          description: plan.description ?? plan.product.description ?? undefined,
          metadata: {
            organizationId: organization.id,
            planId: plan.id,
          },
        },
        unit_amount: plan.priceCents,
        ...(plan.interval !== PlanInterval.ONE_TIME && {
          recurring: this.mapRecurring(plan.interval),
        }),
      },
    };

    const successUrl = this.config.get<string>('STRIPE_CHECKOUT_SUCCESS_URL');
    const cancelUrl = this.config.get<string>('STRIPE_CHECKOUT_CANCEL_URL');

    if (!successUrl || !cancelUrl) {
      throw new BadRequestException(
        'Stripe checkout URLs are not configured',
      );
    }

    const metadata = {
      organizationId: organization.id,
      subscriptionId: subscription.id,
      planId: plan.id,
      customerId: storedCustomer.id,
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: plan.interval === PlanInterval.ONE_TIME ? 'payment' : 'subscription',
      line_items: [lineItem],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: subscription.id,
      customer_email: email,
      metadata,
    };

    if (plan.interval === PlanInterval.ONE_TIME) {
      const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData =
        {
        metadata,
      };
      sessionParams.payment_intent_data = paymentIntentData;
    } else {
      const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData =
        {
        metadata,
      };
      if (plan.trialPeriodDays) {
        subscriptionData.trial_period_days = plan.trialPeriodDays;
      }
      sessionParams.subscription_data = subscriptionData;
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.create(sessionParams, {
        stripeAccount: organization.stripeAccountId,
      });
    } catch (error) {
      await this.prisma.subscription.delete({
        where: { id: subscription.id },
      });
      throw error;
    }

    if (!session.url) {
      throw new BadRequestException('Stripe checkout session invalide');
    }

    return { url: session.url, subscriptionId: subscription.id };
  }

  private mapRecurring(
    interval: PlanInterval,
  ): Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring {
    switch (interval) {
      case PlanInterval.DAY:
        return { interval: 'day' };
      case PlanInterval.WEEK:
        return { interval: 'week' };
      case PlanInterval.MONTH:
        return { interval: 'month' };
      case PlanInterval.QUARTER:
        return { interval: 'month', interval_count: 3 };
      case PlanInterval.YEAR:
        return { interval: 'year' };
      default:
        throw new BadRequestException('Intervalle de plan non supporté');
    }
  }
}
