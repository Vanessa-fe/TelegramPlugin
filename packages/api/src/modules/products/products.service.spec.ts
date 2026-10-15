import { BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VipInvitationsService } from '../vip-invitations/vip-invitations.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { ProductsService } from './products.service';
import { upsertBrevoContact } from '../../common/brevo-sync';

jest.mock('../../common/brevo-sync', () => ({
  upsertBrevoContact: jest.fn(),
}));

jest.mock('@telegram-plugin/shared', () => ({
  queueNames: {},
  GrantAccessPayload: { parse: jest.fn((value) => value) },
  RevokeAccessPayload: { parse: jest.fn((value) => value) },
}));

describe('ProductsService channel links', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const channelId = '22222222-2222-4222-8222-222222222222';
  const productId = '33333333-3333-4333-8333-333333333333';

  let service: ProductsService;
  let prisma: any;
  let channelAccess: { grantMissingAccesses: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      channel: { count: jest.fn().mockResolvedValue(1) },
      organization: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ billingEmail: 'creator@example.com' }),
      },
      product: {
        create: jest.fn().mockResolvedValue({
          id: productId,
          organizationId: orgId,
          channels: [{ channelId }],
        }),
        update: jest.fn().mockResolvedValue({
          id: productId,
          organizationId: orgId,
          channels: [{ channelId }],
        }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ organizationId: orgId }),
        count: jest.fn().mockResolvedValue(1),
      },
      productChannel: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    channelAccess = { grantMissingAccesses: jest.fn().mockResolvedValue(0) };

    service = new ProductsService(
      prisma as PrismaService,
      {
        incrementOffersCreated: jest.fn(),
      } as unknown as VipInvitationsService,
      channelAccess as unknown as ChannelAccessService,
    );
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('should create an offer linked to the selected channel', async () => {
    const product = await service.create({
      organizationId: orgId,
      name: 'Canal VIP',
      channelIds: [channelId],
    });

    expect(prisma.channel.count).toHaveBeenCalledWith({
      where: { id: { in: [channelId] }, organizationId: orgId },
    });
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channels: {
            create: [{ channel: { connect: { id: channelId } } }],
          },
        }),
      }),
    );
    expect(product.channelIds).toEqual([channelId]);
  });

  it('should reject a channel from another organization', async () => {
    prisma.channel.count.mockResolvedValue(0);

    await expect(
      service.create({
        organizationId: orgId,
        name: 'Canal VIP',
        channelIds: [channelId],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('should replace the channel set and grant waiting buyers', async () => {
    await service.update(productId, { channelIds: [channelId] });

    expect(prisma.productChannel.deleteMany).toHaveBeenCalledWith({
      where: { productId, channelId: { notIn: [channelId] } },
    });
    expect(prisma.productChannel.createMany).toHaveBeenCalledWith({
      data: [{ productId, channelId }],
      skipDuplicates: true,
    });
    expect(channelAccess.grantMissingAccesses).toHaveBeenCalledWith({
      productId,
    });
  });

  it('should flag the creator as ready to sell in Brevo', async () => {
    await service.update(productId, { channelIds: [channelId] });

    expect(prisma.product.count).toHaveBeenCalledWith({
      where: {
        organizationId: orgId,
        status: 'ACTIVE',
        channels: { some: { channel: { isActive: true } } },
      },
    });
    expect(upsertBrevoContact).toHaveBeenCalledWith('creator@example.com', {
      attributes: { OFFRE_PRETE: true },
    });
  });

  it('should flag the creator as not ready when no active offer has a channel', async () => {
    prisma.product.count.mockResolvedValue(0);

    await service.create({ organizationId: orgId, name: 'Brouillon' });

    expect(upsertBrevoContact).toHaveBeenCalledWith('creator@example.com', {
      attributes: { OFFRE_PRETE: false },
    });
  });

  it('should still save the offer when Brevo is unreachable', async () => {
    (upsertBrevoContact as jest.Mock).mockRejectedValue(new Error('down'));

    await expect(
      service.update(productId, { name: 'Nouveau nom' }),
    ).resolves.toEqual(expect.objectContaining({ id: productId }));
  });

  it('should leave channel links untouched when channelIds is omitted', async () => {
    await service.update(productId, { name: 'Nouveau nom' });

    expect(prisma.productChannel.deleteMany).not.toHaveBeenCalled();
    expect(channelAccess.grantMissingAccesses).not.toHaveBeenCalled();
  });
});
