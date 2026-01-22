import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { $Enums, PaymentProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { ChannelAccessService } from './channel-access.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ChannelAccessService', () => {
  let service: ChannelAccessService;
  let prisma: jest.Mocked<PrismaService>;
  let queue: jest.Mocked<ChannelAccessQueue>;
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelAccessService,
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findUnique: jest.fn(),
            },
            channelAccess: {
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            entitlement: {
              findFirst: jest.fn(),
              create: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
        {
          provide: ChannelAccessQueue,
          useValue: {
            enqueueGrantAccess: jest.fn(),
            enqueueRevokeAccess: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendPaymentConfirmation: jest.fn(),
            sendPaymentFailed: jest.fn(),
            sendSubscriptionCanceled: jest.fn(),
            sendAccessRevoked: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChannelAccessService>(ChannelAccessService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    queue = module.get(ChannelAccessQueue) as jest.Mocked<ChannelAccessQueue>;
    notifications = module.get(NotificationsService) as jest.Mocked<NotificationsService>;

    // Suppress logs during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePaymentSuccess', () => {
    it('should grant access for all channels in a plan', async () => {
      const mockSubscription = {
        id: 'sub-123',
        customerId: 'cust-123',
        planId: 'plan-123',
        organizationId: 'org-123',
        customer: { id: 'cust-123' },
        plan: {
          id: 'plan-123',
          product: {
            id: 'prod-123',
            channels: [
              { channelId: 'ch-1', channel: { id: 'ch-1', name: 'Channel 1' } },
              { channelId: 'ch-2', channel: { id: 'ch-2', name: 'Channel 2' } },
            ],
          },
        },
        channelAccesses: [],
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prisma.channelAccess.create.mockResolvedValue({} as any);
      queue.enqueueGrantAccess.mockResolvedValue(undefined);

      await service.handlePaymentSuccess('sub-123', PaymentProvider.STRIPE);

      expect(prisma.channelAccess.create).toHaveBeenCalledTimes(2);
      expect(prisma.channelAccess.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: 'sub-123',
          channelId: 'ch-1',
          customerId: 'cust-123',
          status: $Enums.AccessStatus.PENDING,
        },
      });
      expect(prisma.channelAccess.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: 'sub-123',
          channelId: 'ch-2',
          customerId: 'cust-123',
          status: $Enums.AccessStatus.PENDING,
        },
      });

      expect(queue.enqueueGrantAccess).toHaveBeenCalledTimes(2);
      expect(queue.enqueueGrantAccess).toHaveBeenCalledWith({
        subscriptionId: 'sub-123',
        channelId: 'ch-1',
        customerId: 'cust-123',
        provider: 'stripe',
      });
    });

    it('should skip channels that already have GRANTED access', async () => {
      const mockSubscription = {
        id: 'sub-123',
        customerId: 'cust-123',
        planId: 'plan-123',
        organizationId: 'org-123',
        customer: { id: 'cust-123' },
        plan: {
          id: 'plan-123',
          product: {
            id: 'prod-123',
            channels: [
              { channelId: 'ch-1', channel: { id: 'ch-1' } },
              { channelId: 'ch-2', channel: { id: 'ch-2' } },
            ],
          },
        },
        channelAccesses: [
          {
            id: 'access-1',
            channelId: 'ch-1',
            status: $Enums.AccessStatus.GRANTED,
          },
        ],
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prisma.channelAccess.create.mockResolvedValue({} as any);
      queue.enqueueGrantAccess.mockResolvedValue(undefined);

      await service.handlePaymentSuccess('sub-123', PaymentProvider.STRIPE);

      // Should only create access for ch-2, skip ch-1
      expect(prisma.channelAccess.create).toHaveBeenCalledTimes(1);
      expect(prisma.channelAccess.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ channelId: 'ch-2' }),
      });

      expect(queue.enqueueGrantAccess).toHaveBeenCalledTimes(1);
    });

    it('should update existing REVOKED access to PENDING', async () => {
      const mockSubscription = {
        id: 'sub-123',
        customerId: 'cust-123',
        planId: 'plan-123',
        organizationId: 'org-123',
        customer: { id: 'cust-123' },
        plan: {
          id: 'plan-123',
          product: {
            id: 'prod-123',
            channels: [{ channelId: 'ch-1', channel: { id: 'ch-1' } }],
          },
        },
        channelAccesses: [
          {
            id: 'access-1',
            channelId: 'ch-1',
            status: $Enums.AccessStatus.REVOKED,
          },
        ],
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prisma.channelAccess.update.mockResolvedValue({} as any);
      queue.enqueueGrantAccess.mockResolvedValue(undefined);

      await service.handlePaymentSuccess('sub-123', PaymentProvider.STRIPE);

      expect(prisma.channelAccess.update).toHaveBeenCalledWith({
        where: { id: 'access-1' },
        data: {
          status: $Enums.AccessStatus.PENDING,
          grantedAt: null,
          revokedAt: null,
          revokeReason: null,
          inviteId: null,
        },
      });

      expect(prisma.channelAccess.create).not.toHaveBeenCalled();
      expect(queue.enqueueGrantAccess).toHaveBeenCalledTimes(1);
    });

    it('should warn if subscription not found', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await service.handlePaymentSuccess('sub-404', PaymentProvider.STRIPE);

      expect(prisma.channelAccess.create).not.toHaveBeenCalled();
      expect(queue.enqueueGrantAccess).not.toHaveBeenCalled();
    });

    it('should warn if plan/product not resolved', async () => {
      const mockSubscription = {
        id: 'sub-123',
        customerId: 'cust-123',
        planId: null,
        organizationId: 'org-123',
        customer: { id: 'cust-123' },
        plan: null,
        channelAccesses: [],
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription as any);

      await service.handlePaymentSuccess('sub-123', PaymentProvider.STRIPE);

      expect(prisma.channelAccess.create).not.toHaveBeenCalled();
      expect(queue.enqueueGrantAccess).not.toHaveBeenCalled();
    });

    it('should handle empty channel list gracefully', async () => {
      const mockSubscription = {
        id: 'sub-123',
        customerId: 'cust-123',
        planId: 'plan-123',
        organizationId: 'org-123',
        customer: { id: 'cust-123' },
        plan: {
          id: 'plan-123',
          product: {
            id: 'prod-123',
            channels: [],
          },
        },
        channelAccesses: [],
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription as any);

      await service.handlePaymentSuccess('sub-123', PaymentProvider.STRIPE);

      expect(prisma.channelAccess.create).not.toHaveBeenCalled();
      expect(queue.enqueueGrantAccess).not.toHaveBeenCalled();
    });

    it('should continue processing if queue enqueue fails', async () => {
      const mockSubscription = {
        id: 'sub-123',
        customerId: 'cust-123',
        planId: 'plan-123',
        organizationId: 'org-123',
        customer: { id: 'cust-123' },
        plan: {
          id: 'plan-123',
          product: {
            id: 'prod-123',
            channels: [
              { channelId: 'ch-1', channel: { id: 'ch-1' } },
              { channelId: 'ch-2', channel: { id: 'ch-2' } },
            ],
          },
        },
        channelAccesses: [],
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prisma.channelAccess.create.mockResolvedValue({} as any);
      queue.enqueueGrantAccess
        .mockRejectedValueOnce(new Error('Queue error'))
        .mockResolvedValueOnce(undefined);

      await service.handlePaymentSuccess('sub-123', PaymentProvider.STRIPE);

      // Should attempt to enqueue both jobs despite first failure
      expect(queue.enqueueGrantAccess).toHaveBeenCalledTimes(2);
    });
  });

  describe('handlePaymentFailure', () => {
    it('should revoke all PENDING and GRANTED accesses', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-123',
      } as any);
      prisma.channelAccess.updateMany.mockResolvedValue({ count: 2 } as any);
      queue.enqueueRevokeAccess.mockResolvedValue(undefined);

      await service.handlePaymentFailure('sub-123', 'payment_failed');

      expect(prisma.channelAccess.updateMany).toHaveBeenCalledWith({
        where: {
          subscriptionId: 'sub-123',
          status: {
            in: [$Enums.AccessStatus.PENDING, $Enums.AccessStatus.GRANTED],
          },
        },
        data: {
          status: $Enums.AccessStatus.REVOKED,
          revokedAt: expect.any(Date),
          revokeReason: 'payment_failed',
        },
      });

      expect(queue.enqueueRevokeAccess).toHaveBeenCalledWith({
        subscriptionId: 'sub-123',
        reason: 'payment_failed',
      });
    });

    it('should handle canceled reason', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-123',
      } as any);
      prisma.channelAccess.updateMany.mockResolvedValue({ count: 1 } as any);
      queue.enqueueRevokeAccess.mockResolvedValue(undefined);

      await service.handlePaymentFailure('sub-123', 'canceled');

      expect(prisma.channelAccess.updateMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({
          revokeReason: 'canceled',
        }),
      });
    });

    it('should handle refund reason', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-123',
      } as any);
      prisma.channelAccess.updateMany.mockResolvedValue({ count: 1 } as any);
      queue.enqueueRevokeAccess.mockResolvedValue(undefined);

      await service.handlePaymentFailure('sub-123', 'refund');

      expect(prisma.channelAccess.updateMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({
          revokeReason: 'refund',
        }),
      });
    });

    it('should warn if subscription not found', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await service.handlePaymentFailure('sub-404', 'payment_failed');

      expect(prisma.channelAccess.updateMany).not.toHaveBeenCalled();
      expect(queue.enqueueRevokeAccess).not.toHaveBeenCalled();
    });

    it('should continue even if queue enqueue fails', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-123',
      } as any);
      prisma.channelAccess.updateMany.mockResolvedValue({ count: 1 } as any);
      queue.enqueueRevokeAccess.mockRejectedValue(new Error('Queue error'));

      // Should not throw
      await expect(
        service.handlePaymentFailure('sub-123', 'payment_failed'),
      ).resolves.not.toThrow();

      expect(prisma.channelAccess.updateMany).toHaveBeenCalled();
    });
  });
});
