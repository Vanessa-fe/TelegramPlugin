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
});
