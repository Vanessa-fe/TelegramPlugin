import {
  ChannelProvider,
  ChannelType,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelsService } from './channels.service';
import { upsertBrevoContact } from '../../common/brevo-sync';
import { syncOfferReadyToBrevo } from '../../common/offer-readiness';

jest.mock('../../common/brevo-sync', () => ({
  upsertBrevoContact: jest.fn(),
  BREVO_LIST_IDS: { IMPAYE_EN_COURS: 7, GROUP_PUBLISHED: 8 },
}));

jest.mock('../../common/offer-readiness', () => ({
  syncOfferReadyToBrevo: jest.fn(),
}));

describe('ChannelsService offer readiness', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const channelId = '22222222-2222-4222-8222-222222222222';
  const verificationId = '66666666-6666-4666-8666-666666666666';

  let service: ChannelsService;
  let prisma: {
    channel: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    channelVerification: { findUnique: jest.Mock; update: jest.Mock };
    organization: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      channel: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({ id: channelId, organizationId: orgId }),
        update: jest
          .fn()
          .mockResolvedValue({ id: channelId, organizationId: orgId }),
      },
      channelVerification: {
        findUnique: jest.fn().mockResolvedValue({
          id: verificationId,
          organizationId: orgId,
          status: VerificationStatus.VERIFIED,
          provider: ChannelProvider.TELEGRAM,
          type: ChannelType.CHANNEL,
          telegramChatId: '-1001234567890',
          telegramTitle: 'Canal VIP',
          telegramUsername: null,
          verifiedAt: new Date('2026-10-16T10:00:00Z'),
        }),
        update: jest.fn(),
      },
      organization: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ billingEmail: 'creator@example.com' }),
      },
    };
    service = new ChannelsService(prisma as unknown as PrismaService);
  });

  it('should resync OFFRE_PRETE when a channel is deactivated', async () => {
    await service.update(channelId, { isActive: false });

    expect(prisma.channel.update).toHaveBeenCalledWith({
      where: { id: channelId },
      data: { isActive: false },
    });
    expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
      prisma,
      orgId,
      expect.anything(),
    );
  });

  it('should set OFFRE_PRETE before adding the creator to the published list', async () => {
    await service.confirmVerification(verificationId, orgId);

    expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
      prisma,
      orgId,
      expect.anything(),
    );
    expect(upsertBrevoContact).toHaveBeenCalledWith('creator@example.com', {
      attributes: { GROUP_PUBLISHED: true },
      listIds: [8],
    });
    // Brevo workflow 2 starts on list entry and reads OFFRE_PRETE
    expect(
      (syncOfferReadyToBrevo as jest.Mock).mock.invocationCallOrder[0],
    ).toBeLessThan(
      (upsertBrevoContact as jest.Mock).mock.invocationCallOrder[0],
    );
  });
});
