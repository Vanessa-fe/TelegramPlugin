import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PlanInterval, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;

  const mockConfig: any = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_CONNECT_RETURN_URL: 'https://sublynk.test/dashboard/billing',
        STRIPE_CONNECT_REFRESH_URL: 'https://sublynk.test/dashboard/billing',
        STRIPE_CHECKOUT_SUCCESS_URL: 'https://sublynk.test/success',
        STRIPE_CHECKOUT_CANCEL_URL: 'https://sublynk.test/cancel',
      };
      return values[key];
    }),
  } as ConfigService;

  const mockPrisma: any = {
    organization: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
    },
    affiliate: {
      findUnique: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      delete: jest.fn(),
    },
  } as PrismaService;

  const mockStripe: any = {
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BillingService(mockConfig, mockPrisma);
    (service as any).stripe = mockStripe;
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org_123',
      billingEmail: 'owner@example.com',
      stripeAccountId: null,
      saasActive: false,
    });
    mockPrisma.organization.update.mockResolvedValue({
      stripeAccountId: 'acct_connect_123',
    });
    mockPrisma.coupon.findUnique.mockResolvedValue(null);
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    mockPrisma.customer.create.mockResolvedValue({
      id: 'cust_local_123',
    } as any);
    mockPrisma.subscription.create.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
    } as any);
    mockStripe.accounts.retrieve.mockResolvedValue({
      charges_enabled: true,
    });
    mockStripe.accounts.create.mockResolvedValue({
      id: 'acct_connect_123',
    });
    mockStripe.accountLinks.create.mockResolvedValue({
      url: 'https://connect.stripe.test/onboarding',
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
    });
  });

  function buildPlan(overrides?: {
    interval?: PlanInterval;
    stripeAccountId?: string | null;
    saasActive?: boolean;
    takeRatePercent?: number;
    priceCents?: number;
  }) {
    return {
      id: 'plan_123',
      name: 'VIP Mensuel',
      description: 'Acces VIP',
      interval: overrides?.interval ?? PlanInterval.ONE_TIME,
      priceCents: overrides?.priceCents ?? 1000,
      currency: 'eur',
      isActive: true,
      trialPeriodDays: null,
      productId: 'prod_123',
      product: {
        id: 'prod_123',
        description: 'Produit premium',
        status: ProductStatus.ACTIVE,
        organization: {
          id: 'org_123',
          saasActive: overrides?.saasActive ?? true,
          stripeAccountId:
            overrides?.stripeAccountId === undefined
              ? 'acct_creator_123'
              : overrides.stripeAccountId,
          platformSubscription: {
            platformPlan: {
              name: 'growth',
              features: {
                takeRatePercent: overrides?.takeRatePercent ?? 3.5,
              },
            },
          },
        },
      },
    };
  }

  it('creates creator checkout on the connected account with platform fee metadata', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue(buildPlan());
    mockPrisma.affiliate.findUnique.mockResolvedValue({
      id: 'aff_123',
      organizationId: 'org_123',
      status: 'ACTIVE',
      referralCode: 'AFF10',
    } as any);

    await service.createCheckoutSession({
      planId: 'plan_123',
      quantity: 2,
      affiliateCode: 'AFF10',
      affiliateClickId: '22222222-2222-4222-8222-222222222222',
      customer: {
        telegramUsername: 'buyer',
        email: 'buyer@example.com',
      },
    });

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        metadata: expect.objectContaining({
          organizationId: 'org_123',
          productId: 'prod_123',
          planId: 'plan_123',
          subscriptionId: '11111111-1111-4111-8111-111111111111',
          internalSubscriptionId: '11111111-1111-4111-8111-111111111111',
          affiliateId: 'aff_123',
          affiliateCode: 'AFF10',
          affiliateClickId: '22222222-2222-4222-8222-222222222222',
          platformFeeCents: '70',
          quantity: '2',
        }),
        payment_intent_data: expect.objectContaining({
          application_fee_amount: 70,
          metadata: expect.objectContaining({
            productId: 'prod_123',
            platformFeeCents: '70',
          }),
        }),
        line_items: [
          expect.objectContaining({
            quantity: 2,
            price_data: expect.objectContaining({
              unit_amount: 1000,
              product_data: expect.objectContaining({
                metadata: expect.objectContaining({
                  organizationId: 'org_123',
                  productId: 'prod_123',
                  planId: 'plan_123',
                }),
              }),
            }),
          }),
        ],
      }),
      { stripeAccount: 'acct_creator_123' },
    );
  });

  it('fails clearly when the creator Stripe account is missing', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue(
      buildPlan({ stripeAccountId: null }),
    );

    await expect(
      service.createCheckoutSession({
        planId: 'plan_123',
        customer: {
          telegramUsername: 'buyer',
        },
      }),
    ).rejects.toThrow('Compte Stripe du créateur non connecté');

    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('uses application_fee_percent for recurring creator subscriptions', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue(
      buildPlan({
        interval: PlanInterval.MONTH,
        takeRatePercent: 6,
        priceCents: 1500,
      }),
    );

    await service.createCheckoutSession({
      planId: 'plan_123',
      customer: {
        telegramUsername: 'buyer',
      },
    });

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        metadata: expect.objectContaining({
          platformFeeCents: '90',
        }),
        subscription_data: expect.objectContaining({
          application_fee_percent: 6,
          metadata: expect.objectContaining({
            internalSubscriptionId: '11111111-1111-4111-8111-111111111111',
          }),
        }),
      }),
      { stripeAccount: 'acct_creator_123' },
    );
  });

  it('blocks checkout when the connected Stripe account is not charge-enabled', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue(buildPlan());
    mockStripe.accounts.retrieve.mockResolvedValue({
      charges_enabled: false,
    });

    await expect(
      service.createCheckoutSession({
        planId: 'plan_123',
        customer: {
          telegramUsername: 'buyer',
        },
      }),
    ).rejects.toThrow("Compte Stripe incomplet, finalisez l'onboarding");

    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('creates a Stripe Connect onboarding link for a new organization account', async () => {
    const result = await service.createStripeConnectLink('org_123');

    expect(mockStripe.accounts.create).toHaveBeenCalledWith({
      type: 'express',
      email: 'owner@example.com',
      metadata: {
        organizationId: 'org_123',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    expect(mockPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org_123' },
      data: { stripeAccountId: 'acct_connect_123' },
    });
    expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
      account: 'acct_connect_123',
      refresh_url: 'https://sublynk.test/dashboard/billing',
      return_url: 'https://sublynk.test/dashboard/billing',
      type: 'account_onboarding',
    });
    expect(result).toEqual({
      url: 'https://connect.stripe.test/onboarding',
    });
  });

  it('maps incomplete platform profile errors to a clear Stripe Connect message', async () => {
    mockStripe.accountLinks.create.mockRejectedValue({
      type: 'StripeInvalidRequestError',
      requestId: 'req_platform_profile',
      message:
        'Please review the responsibilities of managing losses for connected accounts at https://dashboard.stripe.com/settings/connect/platform-profile.',
    });

    await expectPlatformProfileError();
  });

  it('maps nested Stripe raw platform profile errors to a clear Stripe Connect message', async () => {
    mockStripe.accountLinks.create.mockRejectedValue({
      raw: {
        message:
          'Please review the responsibilities of managing losses for connected accounts at https://dashboard.stripe.com/settings/connect/platform-profile.',
        requestId: 'req_platform_profile_nested',
        type: 'invalid_request_error',
        headers: {
          'request-id': 'req_platform_profile_nested',
        },
      },
    });

    await expectPlatformProfileError();
  });

  async function expectPlatformProfileError() {
    try {
      await service.createStripeConnectLink('org_123');
      throw new Error('Expected createStripeConnectLink to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);

      const response = (error as BadRequestException).getResponse();

      expect(response).toMatchObject({
        code: 'STRIPE_PLATFORM_PROFILE_INCOMPLETE',
        message: expect.stringContaining(
          "Stripe Connect n'est pas encore activé côté plateforme",
        ),
      });
    }
  }
});
