import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AffiliateStatus,
  CouponStatus,
  CouponType,
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

  async createStripeConnectLink(
    organizationId: string,
  ): Promise<{ url: string }> {
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
      throw new BadRequestException('Stripe Connect URLs are not configured');
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  async createStripeLoginLink(
    organizationId: string,
  ): Promise<{ url: string }> {
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
            organization: {
              include: {
                platformSubscription: {
                  include: {
                    platformPlan: {
                      select: {
                        name: true,
                        features: true,
                      },
                    },
                  },
                },
              },
            },
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

    if (!organization.stripeAccountId) {
      throw new BadRequestException('Compte Stripe du créateur non connecté');
    }
    const stripeAccount = await this.stripe.accounts.retrieve(
      organization.stripeAccountId,
    );
    if (!stripeAccount.charges_enabled) {
      throw new ForbiddenException(
        "Compte Stripe incomplet, finalisez l'onboarding",
      );
    }

    if (!organization.saasActive) {
      throw new ForbiddenException('Abonnement SaaS inactif');
    }

    // Validate coupon code if provided
    let validatedCoupon: {
      id: string;
      code: string;
      discountCents: number;
      type: CouponType;
    } | null = null;

    if (payload.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: {
          organizationId_code: {
            organizationId: organization.id,
            code: payload.couponCode.toUpperCase(),
          },
        },
      });

      if (!coupon) {
        throw new BadRequestException('Coupon invalide');
      }

      if (coupon.status !== CouponStatus.ACTIVE) {
        throw new BadRequestException('Ce coupon est désactivé');
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new BadRequestException('Ce coupon a expiré');
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException(
          "Ce coupon a atteint sa limite d'utilisation",
        );
      }

      if (coupon.planIds.length > 0 && !coupon.planIds.includes(plan.id)) {
        throw new BadRequestException(
          "Ce coupon n'est pas valide pour ce plan",
        );
      }

      let discountCents: number;
      if (coupon.type === CouponType.PERCENTAGE) {
        discountCents = Math.round(
          (plan.priceCents * coupon.discountValue) / 100,
        );
      } else {
        discountCents = Math.min(coupon.discountValue, plan.priceCents);
      }

      validatedCoupon = {
        id: coupon.id,
        code: coupon.code,
        discountCents,
        type: coupon.type,
      };
    }

    // Validate affiliate code if provided
    let validatedAffiliate: { id: string; code: string } | null = null;

    if (payload.affiliateCode) {
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { referralCode: payload.affiliateCode.toUpperCase() },
      });

      if (!affiliate) {
        throw new BadRequestException('Code affilié invalide');
      }

      if (affiliate.organizationId !== organization.id) {
        throw new BadRequestException('Code affilié invalide');
      }

      if (affiliate.status !== AffiliateStatus.ACTIVE) {
        throw new BadRequestException("Cet affilié n'est pas actif");
      }

      validatedAffiliate = {
        id: affiliate.id,
        code: affiliate.referralCode,
      };
    }

    const { customer } = payload;
    const telegramUsername = customer.telegramUsername
      ?.toLowerCase()
      .replace(/^@/, '');
    const telegramUserId = customer.telegramUserId?.trim();
    const email = customer.email?.toLowerCase() || undefined;

    if (!telegramUsername) {
      throw new BadRequestException("Nom d'utilisateur Telegram requis");
    }

    const customerFilters: Prisma.CustomerWhereInput[] = [{ telegramUsername }];
    if (telegramUserId) {
      customerFilters.push({ telegramUserId });
    }
    if (email) {
      customerFilters.push({ email });
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
        couponCode: validatedCoupon?.code ?? null,
        affiliateCode: validatedAffiliate?.code ?? null,
        metadata: {
          checkoutMode:
            plan.interval === PlanInterval.ONE_TIME
              ? 'payment'
              : 'subscription',
        },
      },
    });

    // Calculate final price after discount
    const originalPriceCents = plan.priceCents;
    const finalPriceCents = validatedCoupon
      ? Math.max(0, originalPriceCents - validatedCoupon.discountCents)
      : originalPriceCents;
    const platformPlanName =
      organization.platformSubscription?.platformPlan?.name ?? null;
    const platformFeePercent = this.resolvePlatformFeePercent(
      platformPlanName,
      organization.platformSubscription?.platformPlan?.features ?? null,
    );

    const quantity = payload.quantity ?? 1;
    const subtotalCents = finalPriceCents * quantity;
    const platformFeeCents = this.calculatePlatformFeeAmount(
      subtotalCents,
      platformFeePercent,
    );
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity,
      price_data: {
        currency: plan.currency.toLowerCase(),
        product_data: {
          name: plan.name,
          description:
            plan.description ?? plan.product.description ?? undefined,
          metadata: {
            organizationId: organization.id,
            productId: plan.productId,
            planId: plan.id,
          },
        },
        unit_amount: finalPriceCents,
        ...(plan.interval !== PlanInterval.ONE_TIME && {
          recurring: this.mapRecurring(plan.interval),
        }),
      },
    };

    const successUrl = this.config.get<string>('STRIPE_CHECKOUT_SUCCESS_URL');
    const cancelUrl = this.config.get<string>('STRIPE_CHECKOUT_CANCEL_URL');

    if (!successUrl || !cancelUrl) {
      throw new BadRequestException('Stripe checkout URLs are not configured');
    }

    const metadata: Record<string, string> = {
      organizationId: organization.id,
      productId: plan.productId,
      subscriptionId: subscription.id,
      internalSubscriptionId: subscription.id,
      planId: plan.id,
      customerId: storedCustomer.id,
      quantity: String(quantity),
      originalPriceCents: String(originalPriceCents),
      platformPlanName: platformPlanName ?? 'unknown',
      platformFeePercent: String(platformFeePercent),
    };

    if (platformFeeCents > 0) {
      metadata.platformFeeCents = String(platformFeeCents);
    }

    if (validatedCoupon) {
      metadata.couponId = validatedCoupon.id;
      metadata.couponCode = validatedCoupon.code;
      metadata.discountCents = String(validatedCoupon.discountCents);
    }

    if (validatedAffiliate) {
      metadata.affiliateId = validatedAffiliate.id;
      metadata.affiliateCode = validatedAffiliate.code;
    }

    if (payload.affiliateClickId) {
      metadata.affiliateClickId = payload.affiliateClickId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode:
        plan.interval === PlanInterval.ONE_TIME ? 'payment' : 'subscription',
      line_items: [lineItem],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: subscription.id,
      metadata,
      // Email is optional - if not provided, Stripe will ask for it
      ...(email && { customer_email: email }),
    };

    if (plan.interval === PlanInterval.ONE_TIME) {
      const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData =
        {
          metadata,
        };
      if (platformFeeCents > 0) {
        paymentIntentData.application_fee_amount = platformFeeCents;
      }
      sessionParams.payment_intent_data = paymentIntentData;
    } else {
      const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData =
        {
          metadata,
        };
      if (plan.trialPeriodDays) {
        subscriptionData.trial_period_days = plan.trialPeriodDays;
      }
      if (platformFeePercent > 0) {
        subscriptionData.application_fee_percent = platformFeePercent;
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

  private resolvePlatformFeePercent(
    planName: string | null,
    features: Prisma.JsonValue | null,
  ): number {
    const fromFeatures = this.readTakeRatePercent(features);
    if (fromFeatures !== null) {
      return fromFeatures;
    }

    switch (planName) {
      case 'starter':
        return 6;
      case 'growth':
        return 3.5;
      case 'pro':
        return 1.5;
      case 'grandfathered':
        return 0;
      default:
        return 0;
    }
  }

  private readTakeRatePercent(
    features: Prisma.JsonValue | null,
  ): number | null {
    if (!features || typeof features !== 'object' || Array.isArray(features)) {
      return null;
    }

    const raw = (features as Record<string, unknown>).takeRatePercent;

    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      return raw;
    }

    if (typeof raw === 'string') {
      const parsed = Number.parseFloat(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }

    return null;
  }

  private calculatePlatformFeeAmount(
    subtotalCents: number,
    feePercent: number,
  ): number {
    if (subtotalCents <= 0 || feePercent <= 0) {
      return 0;
    }
    return Math.max(0, Math.round((subtotalCents * feePercent) / 100));
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
