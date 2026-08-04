import { ConfigService } from '@nestjs/config';
import { PlanInterval } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostHogService } from '../posthog/posthog.service';
import { VipInvitationsService } from '../vip-invitations/vip-invitations.service';
import { PlatformSubscriptionService } from './platform-subscription.service';

jest.mock('@telegram-plugin/shared', () => ({
  initPostHog: jest.fn(() => null),
  getPostHog: jest.fn(() => null),
  shutdownPostHog: jest.fn(),
  ServerEvents: {
    PLAN_SELECTED: 'plan_selected',
    SUBSCRIPTION_CREATED: 'subscription_created',
  },
}));

describe('PlatformSubscriptionService', () => {
  let service: PlatformSubscriptionService;

  const mockConfig: any = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_123',
        PLATFORM_CHECKOUT_SUCCESS_URL: 'https://sublynk.test/platform/success',
        PLATFORM_CHECKOUT_CANCEL_URL: 'https://sublynk.test/platform/cancel',
        FRONTEND_URL: 'https://sublynk.test',
      };
      return values[key];
    }),
  } as ConfigService;

  const mockPrisma: any = {
    organization: {
      findUnique: jest.fn(),
    },
    platformPlan: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    platformSubscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  } as PrismaService;

  const mockNotifications: any = {
    sendAdminNewSubscriptionNotification: jest.fn(),
  } as NotificationsService;

  const mockPosthog: any = {
    capture: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    events: {
      PLAN_SELECTED: 'plan_selected',
      SUBSCRIPTION_CREATED: 'subscription_created',
    },
  } as PostHogService;

  const mockVipInvitations: any = {
    markConvertedForOrganization: jest.fn(),
  } as VipInvitationsService;

  const mockStripe: any = {
    customers: {
      create: jest.fn(),
    },
    prices: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      list: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlatformSubscriptionService(
      mockConfig,
      mockPrisma,
      mockNotifications,
      mockPosthog,
      mockVipInvitations,
    );
    (service as any).stripe = mockStripe;

    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org_123',
      billingEmail: 'billing@sublynk.test',
      name: 'Org Test',
      platformSubscription: null,
    });
    mockPrisma.platformPlan.findUnique.mockResolvedValue({
      id: 'platform_plan_growth',
      name: 'growth',
      displayName: 'Growth',
      priceCents: 2900,
      currency: 'eur',
      interval: PlanInterval.MONTH,
      trialPeriodDays: 14,
      isActive: true,
      stripePriceId: null,
    });
    mockStripe.customers.create.mockResolvedValue({
      id: 'cus_platform_123',
    });
    mockStripe.prices.create.mockResolvedValue({
      id: 'price_platform_123',
    });
    mockPrisma.platformPlan.update.mockResolvedValue({} as any);
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_platform_123',
      url: 'https://checkout.stripe.test/platform',
    });
    mockStripe.subscriptions.list.mockResolvedValue({ data: [] });
    mockPrisma.platformSubscription.upsert.mockResolvedValue({} as any);
  });

  it('creates SaaS checkout on the platform account without stripeAccount context', async () => {
    await service.createCheckoutSession('org_123', 'growth');

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'subscription',
      customer: 'cus_platform_123',
      line_items: [
        {
          price: 'price_platform_123',
          quantity: 1,
        },
      ],
      success_url:
        'https://sublynk.test/platform/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://sublynk.test/platform/cancel',
      metadata: {
        organizationId: 'org_123',
        platformPlanId: 'platform_plan_growth',
        type: 'platform',
      },
      subscription_data: {
        metadata: {
          organizationId: 'org_123',
          platformPlanId: 'platform_plan_growth',
          type: 'platform',
        },
      },
    });
    expect(mockStripe.checkout.sessions.create.mock.calls[0]).toHaveLength(1);
  });

  it('recovers a paid subscription when the checkout webhook was missed', async () => {
    const incompleteSubscription = {
      id: 'platform_subscription_123',
      organizationId: 'org_123',
      platformPlanId: 'platform_plan_growth',
      status: 'INCOMPLETE',
      stripeCustomerId: 'cus_platform_123',
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      trialEndsAt: null,
      canceledAt: null,
      cancelAtPeriodEnd: false,
      graceUntil: null,
      metadata: null,
      createdAt: new Date('2026-08-02T22:14:00.000Z'),
      platformPlan: {
        id: 'platform_plan_growth',
        name: 'growth',
        displayName: 'Growth',
        priceCents: 2900,
        currency: 'eur',
        interval: PlanInterval.MONTH,
        trialPeriodDays: 0,
        features: null,
        isActive: true,
        sortOrder: 1,
      },
    };
    const activeSubscription = {
      ...incompleteSubscription,
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_paid_123',
      currentPeriodStart: new Date('2026-08-02T22:17:13.000Z'),
      currentPeriodEnd: new Date('2026-09-02T22:17:13.000Z'),
    };
    mockPrisma.platformSubscription.findUnique
      .mockResolvedValueOnce(incompleteSubscription)
      .mockResolvedValueOnce(activeSubscription);
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [
        {
          id: 'sub_paid_123',
          status: 'active',
          created: 1785709033,
          current_period_start: 1785709033,
          current_period_end: 1788387433,
          trial_end: null,
          cancel_at_period_end: false,
          canceled_at: null,
          metadata: { type: 'platform', organizationId: 'org_123' },
        },
      ],
    });
    jest.spyOn(service, 'updateSaasActive').mockResolvedValue();

    const result = await service.getSubscription('org_123');

    expect(mockPrisma.platformSubscription.update).toHaveBeenCalledWith({
      where: { organizationId: 'org_123' },
      data: expect.objectContaining({
        stripeSubscriptionId: 'sub_paid_123',
        status: 'ACTIVE',
      }),
    });
    expect(result?.status).toBe('ACTIVE');
    expect(result?.stripeSubscriptionId).toBe('sub_paid_123');
  });

  it('does not create another checkout after recovering an active subscription', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org_123',
      billingEmail: 'billing@sublynk.test',
      name: 'Org Test',
      platformSubscription: {
        status: 'INCOMPLETE',
        stripeCustomerId: 'cus_platform_123',
        platformPlan: { name: 'growth' },
      },
    });
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [
        {
          id: 'sub_paid_123',
          status: 'active',
          created: 1785709033,
          current_period_start: 1785709033,
          current_period_end: 1788387433,
          trial_end: null,
          cancel_at_period_end: false,
          canceled_at: null,
          metadata: { type: 'platform', organizationId: 'org_123' },
        },
      ],
    });
    jest.spyOn(service, 'updateSaasActive').mockResolvedValue();

    await expect(
      service.createCheckoutSession('org_123', 'growth'),
    ).rejects.toThrow('Un abonnement plateforme est déjà actif');
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
