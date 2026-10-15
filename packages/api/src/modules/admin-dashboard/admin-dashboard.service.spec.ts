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

describe('AdminDashboardService unpaid list', () => {
  const failedEvent = (
    id: string,
    invoice: Record<string, unknown>,
    account?: string,
  ) => ({
    id,
    type: PaymentEventType.INVOICE_PAYMENT_FAILED,
    occurredAt: new Date('2026-10-08T20:33:47.000Z'),
    organizationId: 'org-1',
    organization: { name: 'cote andcash' },
    subscriptionId: null,
    subscription: null,
    payload: { account, data: { object: invoice } },
  });

  const buildService = (events: unknown[], paidInvoiceIds: string[]) => {
    const prisma = {
      paymentEvent: { findMany: jest.fn().mockResolvedValue(events) },
      $queryRaw: jest
        .fn()
        .mockResolvedValue(
          paidInvoiceIds.map((invoiceId) => ({ invoice_id: invoiceId })),
        ),
    } as unknown as PrismaService;
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    return new AdminDashboardService(prisma, config);
  };

  it('hides card declines at checkout and invoices paid afterwards', async () => {
    const service = buildService(
      [
        failedEvent(
          'checkout-decline',
          { id: 'in_1', billing_reason: 'subscription_create', amount_due: 5000 },
          'acct_creator',
        ),
        failedEvent(
          'paid-later',
          { id: 'in_2', billing_reason: 'subscription_cycle', amount_due: 5000 },
          'acct_creator',
        ),
        failedEvent(
          'still-unpaid',
          {
            id: 'in_3',
            billing_reason: 'subscription_cycle',
            amount_due: 5000,
            currency: 'eur',
            customer_email: 'buyer@example.com',
          },
          'acct_creator',
        ),
      ],
      ['in_2'],
    );

    const result = await service.getFailedPaymentsList(30);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'still-unpaid',
        amount: 5000,
        customerEmail: 'buyer@example.com',
        source: 'BUYER',
      }),
    ]);
  });

  it("flags the creator's own Sublynk plan as a platform unpaid", async () => {
    const service = buildService(
      [
        failedEvent('platform', {
          id: 'in_9',
          billing_reason: 'subscription_cycle',
          amount_due: 2900,
        }),
      ],
      [],
    );

    const [item] = await service.getFailedPaymentsList(30);

    expect(item).toEqual(
      expect.objectContaining({ source: 'PLATFORM', amount: 2900 }),
    );
  });
});
