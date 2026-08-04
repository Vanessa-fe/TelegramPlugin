import { ConfigService } from '@nestjs/config';
import { PaymentEventType, SubscriptionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService commission summary', () => {
  const prisma = {
    organization: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;
  const config = {
    get: jest.fn().mockReturnValue('sk_test_123'),
  } as unknown as ConfigService;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates Stripe application fees by connected organization', async () => {
    const service = new AdminDashboardService(prisma, config);
    (service as any).stripe = {
      applicationFees: {
        list: jest.fn().mockResolvedValue({
          has_more: false,
          data: [
            {
              id: 'fee_123',
              account: 'acct_creator_123',
              amount: 600,
              amount_refunded: 100,
              currency: 'eur',
              charge: { id: 'ch_123', amount: 10000 },
            },
          ],
        }),
      },
    };
    (prisma.organization.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'org_123',
        name: 'Créateur Test',
        stripeAccountId: 'acct_creator_123',
        platformSubscription: {
          platformPlan: { name: 'starter', displayName: 'Starter' },
        },
      },
    ]);

    const result = await service.getCommissionSummary(30);

    expect(result.feeCount).toBe(1);
    expect(result.totals).toEqual([
      {
        currency: 'EUR',
        grossSalesCents: 10000,
        grossCommissionCents: 600,
        refundedCommissionCents: 100,
        netCommissionCents: 500,
      },
    ]);
    expect(result.byOrganization[0]).toEqual(
      expect.objectContaining({
        organizationId: 'org_123',
        organizationName: 'Créateur Test',
        platformPlan: 'Starter',
        grossSalesCents: 10000,
        netCommissionCents: 500,
      }),
    );
  });

  it('returns an empty summary when Stripe has no application fees', async () => {
    const service = new AdminDashboardService(prisma, config);
    (service as any).stripe = {
      applicationFees: {
        list: jest.fn().mockResolvedValue({ has_more: false, data: [] }),
      },
    };

    await expect(service.getCommissionSummary(30)).resolves.toEqual({
      days: 30,
      feeCount: 0,
      totals: [],
      byOrganization: [],
    });
    expect(prisma.organization.findMany).not.toHaveBeenCalled();
  });
});

describe('AdminDashboardService creator commerce metrics', () => {
  it('separates prospects, paying customers, checkouts and confirmed sales', async () => {
    const now = new Date();
    const prisma = {
      organization: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'org_123',
            name: 'Créateur Test',
            slug: 'createur-test',
            billingEmail: 'creator@example.com',
            saasActive: true,
            suspendedAt: null,
            createdAt: now,
            users: [{ email: 'creator@example.com', lastLoginAt: now }],
            channels: [{ id: 'channel_1' }],
            customers: [{ id: 'customer_paid' }, { id: 'customer_prospect' }],
            subscriptions: [
              {
                id: 'subscription_paid',
                createdAt: now,
                status: SubscriptionStatus.ACTIVE,
              },
              {
                id: 'subscription_abandoned',
                createdAt: now,
                status: SubscriptionStatus.INCOMPLETE,
              },
            ],
            platformSubscription: null,
          },
        ]),
      },
      paymentEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            organizationId: 'org_123',
            type: PaymentEventType.INVOICE_PAID,
            payload: { data: { object: { amount_paid: 1000 } } },
            occurredAt: now,
            subscription: { customerId: 'customer_paid' },
          },
          {
            organizationId: 'org_123',
            type: PaymentEventType.CHECKOUT_COMPLETED,
            payload: {
              data: {
                object: { mode: 'subscription', payment_status: 'paid' },
              },
            },
            occurredAt: now,
            subscription: { customerId: 'customer_paid' },
          },
          {
            organizationId: 'org_123',
            type: PaymentEventType.CHECKOUT_COMPLETED,
            payload: {
              data: { object: { mode: 'payment', payment_status: 'unpaid' } },
            },
            occurredAt: now,
            subscription: { customerId: 'customer_prospect' },
          },
        ]),
      },
    } as unknown as PrismaService;
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const service = new AdminDashboardService(prisma, config);

    const result = await service.getCreatorsList();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        customersCount: 2,
        prospectsCount: 1,
        checkoutsStartedCount: 2,
        payingCustomersCount: 1,
        activeSubscriptionsCount: 1,
        salesCount: 1,
      }),
    );
    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          users: { none: { role: UserRole.SUPERADMIN } },
        }),
      }),
    );
  });
});

describe('AdminDashboardService payment history', () => {
  it('separates one-time sales, new subscriptions and renewals without duplicates', async () => {
    const occurredAt = new Date('2026-08-01T12:00:00.000Z');
    const relation = {
      organization: { name: 'Créateur Test' },
      subscription: {
        customer: { email: 'client@example.com', displayName: 'Client' },
        plan: {
          name: 'VIP',
          currency: 'eur',
          priceCents: 1000,
          interval: 'MONTH',
        },
      },
    };
    const prisma = {
      paymentEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            ...relation,
            id: 'one-time',
            type: PaymentEventType.CHECKOUT_COMPLETED,
            provider: 'STRIPE',
            occurredAt,
            payload: {
              data: {
                object: {
                  mode: 'payment',
                  payment_status: 'paid',
                  amount_total: 2500,
                  currency: 'eur',
                },
              },
            },
          },
          {
            ...relation,
            id: 'subscription-checkout',
            type: PaymentEventType.CHECKOUT_COMPLETED,
            provider: 'STRIPE',
            occurredAt,
            payload: {
              data: {
                object: { mode: 'subscription', payment_status: 'paid' },
              },
            },
          },
          {
            ...relation,
            id: 'first-invoice',
            type: PaymentEventType.INVOICE_PAID,
            provider: 'STRIPE',
            occurredAt,
            payload: {
              data: {
                object: {
                  billing_reason: 'subscription_create',
                  amount_paid: 1000,
                  currency: 'eur',
                },
              },
            },
          },
          {
            ...relation,
            id: 'renewal',
            type: PaymentEventType.INVOICE_PAID,
            provider: 'STRIPE',
            occurredAt,
            payload: {
              data: {
                object: {
                  billing_reason: 'subscription_cycle',
                  amount_paid: 1000,
                  currency: 'eur',
                },
              },
            },
          },
        ]),
      },
    } as unknown as PrismaService;
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const result = await new AdminDashboardService(
      prisma,
      config,
    ).getPaymentsList(30);

    expect(result.map((payment) => payment.kind)).toEqual([
      'ONE_TIME',
      'NEW_SUBSCRIPTION',
      'RENEWAL',
    ]);
    expect(result).toHaveLength(3);
  });
});
