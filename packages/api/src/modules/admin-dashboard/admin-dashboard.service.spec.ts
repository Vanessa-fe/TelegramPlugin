import { ConfigService } from '@nestjs/config';
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
