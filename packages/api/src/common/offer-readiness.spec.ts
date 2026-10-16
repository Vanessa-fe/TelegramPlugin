import { Logger } from '@nestjs/common';
import { upsertBrevoContact } from './brevo-sync';
import { readyOffersWhere, syncOfferReadyToBrevo } from './offer-readiness';

jest.mock('./brevo-sync', () => ({
  upsertBrevoContact: jest.fn(),
}));

describe('syncOfferReadyToBrevo', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';

  let prisma: {
    organization: { findUnique: jest.Mock };
    product: { count: jest.Mock };
  };
  let client: Parameters<typeof syncOfferReadyToBrevo>[0];
  let logger: Logger;
  let logError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      organization: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ billingEmail: 'creator@example.com' }),
      },
      product: { count: jest.fn().mockResolvedValue(1) },
    };
    client = prisma as unknown as typeof client;
    logger = new Logger('test');
    logError = jest.spyOn(logger, 'error').mockImplementation();
  });

  it('should only count offers a buyer can pay for right now', () => {
    expect(readyOffersWhere(orgId)).toEqual({
      organizationId: orgId,
      status: 'ACTIVE',
      plans: { some: { isActive: true } },
      channels: { some: { channel: { isActive: true } } },
      organization: { saasActive: true, stripeAccountId: { not: null } },
    });
  });

  it('should flag the creator as ready when a payable offer exists', async () => {
    await syncOfferReadyToBrevo(client, orgId, logger);

    expect(prisma.product.count).toHaveBeenCalledWith({
      where: readyOffersWhere(orgId),
    });
    expect(upsertBrevoContact).toHaveBeenCalledWith('creator@example.com', {
      attributes: { OFFRE_PRETE: true },
    });
  });

  it('should flag the creator as not ready when no offer is payable', async () => {
    // e.g. active offer and channel, but no formule or no Stripe account
    prisma.product.count.mockResolvedValue(0);

    await syncOfferReadyToBrevo(client, orgId, logger);

    expect(upsertBrevoContact).toHaveBeenCalledWith('creator@example.com', {
      attributes: { OFFRE_PRETE: false },
    });
  });

  it('should skip organizations without a billing email', async () => {
    prisma.organization.findUnique.mockResolvedValue({ billingEmail: '' });

    await syncOfferReadyToBrevo(client, orgId, logger);

    expect(upsertBrevoContact).not.toHaveBeenCalled();
  });

  it('should log instead of throwing when Brevo is unreachable', async () => {
    (upsertBrevoContact as jest.Mock).mockRejectedValue(new Error('down'));

    await expect(
      syncOfferReadyToBrevo(client, orgId, logger),
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(
      `Failed to sync OFFRE_PRETE to Brevo for org ${orgId}`,
      expect.any(Error),
    );
  });
});
