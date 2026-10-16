import { PlanInterval } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlansService } from './plans.service';
import { syncOfferReadyToBrevo } from '../../common/offer-readiness';

jest.mock('../../common/offer-readiness', () => ({
  syncOfferReadyToBrevo: jest.fn(),
}));

describe('PlansService offer readiness', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const productId = '33333333-3333-4333-8333-333333333333';
  const planId = '44444444-4444-4444-8444-444444444444';

  let service: PlansService;
  let prisma: {
    product: { findUnique: jest.Mock };
    plan: { create: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      product: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ organization: { id: orgId, currency: 'EUR' } }),
      },
      plan: {
        create: jest.fn().mockResolvedValue({ id: planId, productId }),
        update: jest.fn().mockResolvedValue({ id: planId, productId }),
        findUnique: jest.fn().mockResolvedValue({
          productId,
          currency: 'EUR',
          interval: PlanInterval.MONTH,
          product: { organizationId: orgId },
        }),
      },
    };
    service = new PlansService(prisma as unknown as PrismaService);
  });

  it('should resync OFFRE_PRETE when a formule is added', async () => {
    await service.create({
      productId,
      name: 'Mensuel',
      interval: PlanInterval.MONTH,
      priceCents: 990,
      currency: 'EUR',
    });

    expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
      prisma,
      orgId,
      expect.anything(),
    );
  });

  it('should resync OFFRE_PRETE when a formule is deactivated', async () => {
    await service.update(planId, { isActive: false });

    expect(prisma.plan.update).toHaveBeenCalledWith({
      where: { id: planId },
      data: { isActive: false, accessDurationDays: null },
    });
    expect(syncOfferReadyToBrevo).toHaveBeenCalledTimes(1);
    expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
      prisma,
      orgId,
      expect.anything(),
    );
  });

  it('should resync both organizations when a formule moves to another one', async () => {
    const otherOrgId = '55555555-5555-4555-8555-555555555555';
    prisma.plan.findUnique.mockResolvedValue({
      productId,
      currency: 'EUR',
      interval: PlanInterval.MONTH,
      product: { organizationId: otherOrgId },
    });

    await service.update(planId, { productId });

    expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
      prisma,
      orgId,
      expect.anything(),
    );
    expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
      prisma,
      otherOrgId,
      expect.anything(),
    );
  });
});
