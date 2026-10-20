import { ConfigService } from '@nestjs/config';
import { PlanInterval } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostHogService } from '../posthog/posthog.service';
import { VipInvitationsService } from '../vip-invitations/vip-invitations.service';
import { PlatformSubscriptionService } from './platform-subscription.service';
import {
  removeBrevoContactFromList,
  upsertBrevoContact,
} from '../../common/brevo-sync';
import { syncOfferReadyToBrevo } from '../../common/offer-readiness';

jest.mock('../../common/offer-readiness', () => ({
  syncOfferReadyToBrevo: jest.fn(),
}));

jest.mock('../../common/brevo-sync', () => ({
  upsertBrevoContact: jest.fn(),
  removeBrevoContactFromList: jest.fn(),
  BREVO_LIST_IDS: { IMPAYE_EN_COURS: 7, GROUP_PUBLISHED: 8 },
}));

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
      update: jest.fn(),
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
      retrieve: jest.fn(),
    },
    accounts: {
      retrieve: jest.fn(),
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

  describe('updateSaasActive', () => {
    const organization = (saasActive: boolean) => ({
      id: 'org_123',
      billingEmail: 'billing@sublynk.test',
      saasActive,
      stripeAccountId: 'acct_connect_123',
      platformSubscription: { status: 'ACTIVE', metadata: null },
    });

    beforeEach(() => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        charges_enabled: true,
        details_submitted: true,
      });
    });

    it('resyncs OFFRE_PRETE once the Stripe account can take payments', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(organization(false));

      await service.updateSaasActive('org_123');

      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org_123' },
        data: { saasActive: true },
      });
      expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
        mockPrisma,
        'org_123',
        expect.anything(),
      );
    });

    it('resyncs OFFRE_PRETE when the creator loses saasActive', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(organization(true));
      mockStripe.accounts.retrieve.mockResolvedValue({
        charges_enabled: false,
        details_submitted: true,
      });

      await service.updateSaasActive('org_123');

      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org_123' },
        data: { saasActive: false },
      });
      expect(syncOfferReadyToBrevo).toHaveBeenCalledTimes(1);
    });

    it('leaves Brevo alone when saasActive does not change', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(organization(true));

      await service.updateSaasActive('org_123');

      expect(mockPrisma.organization.update).not.toHaveBeenCalled();
      expect(syncOfferReadyToBrevo).not.toHaveBeenCalled();
    });

    it('keeps a suspended creator unable to sell even with a paid plan', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        ...organization(true),
        suspendedAt: new Date('2026-10-01T09:00:00.000Z'),
      });

      await service.updateSaasActive('org_123');

      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org_123' },
        data: { saasActive: false },
      });
    });
  });

  describe('subscription webhooks (API 2025-09-30.clover payload)', () => {
    beforeEach(() => {
      jest.spyOn(service, 'updateSaasActive').mockResolvedValue(undefined);
    });

    it('saves the status and period Stripe has now, not the payload', async () => {
      // Clover payload: no current_period_* on the subscription
      const payload = {
        id: 'sub_platform_1',
        status: 'active',
        metadata: { organizationId: 'org_123', type: 'platform' },
      };
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        ...payload,
        status: 'past_due',
        current_period_start: 1788387433,
        current_period_end: 1790979433,
        trial_end: null,
        cancel_at_period_end: false,
        canceled_at: null,
      });

      await service.handleWebhookEvent({
        type: 'customer.subscription.updated',
        data: { object: payload },
      } as any);

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith(
        'sub_platform_1',
      );
      expect(mockPrisma.platformSubscription.update).toHaveBeenCalledWith({
        where: { organizationId: 'org_123' },
        data: expect.objectContaining({
          status: 'PAST_DUE',
          currentPeriodStart: new Date(1788387433 * 1000),
          currentPeriodEnd: new Date(1790979433 * 1000),
        }),
      });
      expect(service.updateSaasActive).toHaveBeenCalledWith('org_123');
    });

    const deletedEvent = (reason: string) =>
      ({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_platform_1',
            status: 'canceled',
            cancellation_details: { reason },
          },
        },
      }) as any;

    it('gives no grace period to a plan Stripe ended unpaid', async () => {
      mockPrisma.platformSubscription.findUnique.mockResolvedValue({
        id: 'ps_1',
        organizationId: 'org_123',
        status: 'PAST_DUE',
        metadata: null,
      });

      await service.handleWebhookEvent(deletedEvent('payment_failed'));

      expect(mockPrisma.platformSubscription.update).toHaveBeenCalledWith({
        where: { id: 'ps_1' },
        data: expect.objectContaining({
          status: 'CANCELED',
          graceUntil: null,
        }),
      });
      expect(service.updateSaasActive).toHaveBeenCalledWith('org_123');
    });

    it('keeps the grace period when the creator cancels a paid plan', async () => {
      mockPrisma.platformSubscription.findUnique.mockResolvedValue({
        id: 'ps_1',
        organizationId: 'org_123',
        status: 'ACTIVE',
        metadata: null,
      });

      await service.handleWebhookEvent(deletedEvent('cancellation_requested'));

      expect(mockPrisma.platformSubscription.update).toHaveBeenCalledWith({
        where: { id: 'ps_1' },
        data: expect.objectContaining({
          status: 'CANCELED',
          graceUntil: expect.any(Date),
        }),
      });
    });
  });

  describe('invoice webhooks (API 2025-09-30.clover payload)', () => {
    // Clover payloads: no invoice.subscription, the link is under parent
    const cloverInvoice = (type: string) =>
      ({
        type,
        data: {
          object: {
            id: 'in_platform',
            parent: {
              subscription_details: {
                subscription: 'sub_platform_1',
                metadata: { organizationId: 'org_123' },
              },
            },
          },
        },
      }) as any;

    beforeEach(() => {
      jest.spyOn(service, 'updateSaasActive').mockResolvedValue(undefined);
    });

    it('marks the creator past due and flags them in Brevo', async () => {
      mockPrisma.platformSubscription.findUnique.mockResolvedValue({
        id: 'ps_1',
        organizationId: 'org_123',
        status: 'ACTIVE',
        metadata: null,
      });

      await service.handleWebhookEvent(cloverInvoice('invoice.payment_failed'));

      expect(mockPrisma.platformSubscription.findUnique).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_platform_1' },
      });
      expect(mockPrisma.platformSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PAST_DUE' }),
        }),
      );
      expect(upsertBrevoContact).toHaveBeenCalledWith('billing@sublynk.test', {
        listIds: [7],
      });
    });

    it('reactivates the creator once the invoice is paid', async () => {
      mockPrisma.platformSubscription.findUnique.mockResolvedValue({
        id: 'ps_1',
        organizationId: 'org_123',
        status: 'PAST_DUE',
        metadata: null,
      });

      await service.handleWebhookEvent(
        cloverInvoice('invoice.payment_succeeded'),
      );

      expect(mockPrisma.platformSubscription.update).toHaveBeenCalledWith({
        where: { id: 'ps_1' },
        data: { status: 'ACTIVE', graceUntil: null },
      });
      expect(removeBrevoContactFromList).toHaveBeenCalledWith(
        'billing@sublynk.test',
        7,
      );
      expect(service.updateSaasActive).toHaveBeenCalledWith('org_123');
    });

    const unpaidMetadata = {
      checkoutSessionId: 'cs_platform_1',
      failedPaymentAttempts: 3,
      firstFailedAt: '2026-09-02T22:17:47.000Z',
      lastFailedAt: '2026-09-09T22:17:47.000Z',
      paymentWarningSentAt: '2026-09-07T09:00:00.000Z',
      suspendedAt: '2026-09-09T09:00:00.000Z',
      suspendedReason: 'Échec de paiement répété (3 tentatives)',
    };

    it('lifts the unpaid-plan suspension and resets the failure count once paid', async () => {
      mockPrisma.platformSubscription.findUnique.mockResolvedValue({
        id: 'ps_1',
        organizationId: 'org_123',
        status: 'PAST_DUE',
        metadata: unpaidMetadata,
      });
      mockPrisma.organization.findUnique.mockResolvedValue({
        billingEmail: 'billing@sublynk.test',
        suspendedAt: new Date('2026-09-09T09:00:00.000Z'),
        suspendReason: 'Échec de paiement répété (3 tentatives)',
      });

      await service.handleWebhookEvent(
        cloverInvoice('invoice.payment_succeeded'),
      );

      expect(mockPrisma.platformSubscription.update).toHaveBeenCalledWith({
        where: { id: 'ps_1' },
        data: { metadata: { checkoutSessionId: 'cs_platform_1' } },
      });
      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org_123' },
        data: { suspendedAt: null, suspendReason: null },
      });
      expect(service.updateSaasActive).toHaveBeenCalledWith('org_123');
    });

    it('keeps a suspension an admin applied for another reason', async () => {
      mockPrisma.platformSubscription.findUnique.mockResolvedValue({
        id: 'ps_1',
        organizationId: 'org_123',
        status: 'PAST_DUE',
        metadata: unpaidMetadata,
      });
      mockPrisma.organization.findUnique.mockResolvedValue({
        billingEmail: 'billing@sublynk.test',
        suspendedAt: new Date('2026-10-01T09:00:00.000Z'),
        suspendReason: 'Fraude',
      });

      await service.handleWebhookEvent(
        cloverInvoice('invoice.payment_succeeded'),
      );

      expect(mockPrisma.organization.update).not.toHaveBeenCalled();
    });

    it('does not revive a plan Stripe already ended', async () => {
      mockPrisma.platformSubscription.findUnique.mockResolvedValue({
        id: 'ps_1',
        organizationId: 'org_123',
        status: 'CANCELED',
        metadata: unpaidMetadata,
      });

      await service.handleWebhookEvent(
        cloverInvoice('invoice.payment_succeeded'),
      );

      expect(mockPrisma.platformSubscription.update).not.toHaveBeenCalled();
      expect(mockPrisma.organization.update).not.toHaveBeenCalled();
      expect(service.updateSaasActive).not.toHaveBeenCalled();
    });
  });
});
