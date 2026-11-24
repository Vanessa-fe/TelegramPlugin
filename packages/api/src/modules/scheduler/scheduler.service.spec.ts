import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { DataExportsService } from '../data-exports/data-exports.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminDashboardService } from '../admin-dashboard/admin-dashboard.service';
import { syncOfferReadyToBrevo } from '../../common/offer-readiness';
import { syncCreatorEngagementToBrevo } from './creator-engagement';

jest.mock('../../common/offer-readiness', () => ({
  ...jest.requireActual<typeof import('../../common/offer-readiness')>(
    '../../common/offer-readiness',
  ),
  syncOfferReadyToBrevo: jest.fn(),
}));

jest.mock('./creator-engagement', () => ({
  ...jest.requireActual<typeof import('./creator-engagement')>(
    './creator-engagement',
  ),
  syncCreatorEngagementToBrevo: jest.fn(),
}));

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: jest.Mocked<PrismaService>;
  let channelAccessService: jest.Mocked<ChannelAccessService>;
  let config: jest.Mocked<ConfigService>;
  let dataExportsService: jest.Mocked<DataExportsService>;
  let adminDashboardService: jest.Mocked<AdminDashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: PrismaService,
          useValue: {
            organization: {
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
            subscription: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
            auditLog: {
              deleteMany: jest.fn(),
            },
            paymentEvent: {
              deleteMany: jest.fn(),
            },
            product: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ChannelAccessService,
          useValue: {
            handlePaymentFailure: jest.fn(),
          },
        },
        {
          provide: DataExportsService,
          useValue: {
            processPendingExports: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        { provide: OrganizationsService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        {
          provide: AdminDashboardService,
          useValue: { getCreatorsList: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SchedulerService);
    prisma = module.get(PrismaService);
    channelAccessService = module.get(ChannelAccessService);
    config = module.get(ConfigService);
    dataExportsService = module.get(DataExportsService);
    adminDashboardService = module.get(AdminDashboardService);

    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('handleExpiredGracePeriods', () => {
    it('should revoke subscriptions with expired grace', async () => {
      prisma.subscription.findMany.mockResolvedValue([
        { id: 'sub-1' },
        { id: 'sub-2' },
      ] as any);

      await service.handleExpiredGracePeriods();

      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledTimes(
        2,
      );
      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-1',
        'payment_failed',
      );
      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-2',
        'payment_failed',
      );
    });

    it('should skip when no expired grace subscriptions exist', async () => {
      prisma.subscription.findMany.mockResolvedValue([]);

      await service.handleExpiredGracePeriods();

      expect(channelAccessService.handlePaymentFailure).not.toHaveBeenCalled();
    });
  });

  describe('handleInactivePlatformSubscriptions', () => {
    it('should disable saas and hard-stop customer subscriptions when platform is inactive', async () => {
      prisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }] as any);
      prisma.organization.updateMany.mockResolvedValue({ count: 1 } as any);
      prisma.subscription.findMany.mockResolvedValue([
        { id: 'sub-1' },
        { id: 'sub-2' },
      ] as any);
      prisma.subscription.update.mockResolvedValue({ id: 'sub-1' } as any);

      await service.handleInactivePlatformSubscriptions();

      expect(prisma.organization.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['org-1'] } },
        data: { saasActive: false },
      });
      expect(syncOfferReadyToBrevo).toHaveBeenCalledWith(
        prisma,
        'org-1',
        expect.anything(),
      );
      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledTimes(
        2,
      );
      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-1',
        'canceled',
      );
      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-2',
        'canceled',
      );
      expect(prisma.subscription.update).toHaveBeenCalledTimes(2);
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
        }),
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-2' },
        }),
      );
    });

    it('should skip revocation when no impacted subscriptions are found', async () => {
      prisma.organization.findMany.mockResolvedValue([]);
      prisma.subscription.findMany.mockResolvedValue([]);

      await service.handleInactivePlatformSubscriptions();

      expect(prisma.organization.updateMany).not.toHaveBeenCalled();
      expect(syncOfferReadyToBrevo).not.toHaveBeenCalled();
      expect(channelAccessService.handlePaymentFailure).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('cleanupRetentionData', () => {
    it('should delete records older than retention windows', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00Z'));
      config.get.mockImplementation((key: string) => {
        if (key === 'AUDIT_LOG_RETENTION_DAYS') {
          return '10';
        }
        if (key === 'PAYMENT_EVENT_RETENTION_DAYS') {
          return '20';
        }
        return undefined;
      });
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 2 } as any);
      prisma.paymentEvent.deleteMany.mockResolvedValue({ count: 3 } as any);

      await service.cleanupRetentionData();

      const now = new Date();
      const auditCutoff = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const paymentCutoff = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: auditCutoff,
          },
        },
      });
      expect(prisma.paymentEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: paymentCutoff,
          },
        },
      });
    });
  });

  describe('handlePendingDataExports', () => {
    it('should process pending exports', async () => {
      await service.handlePendingDataExports();

      expect(dataExportsService.processPendingExports).toHaveBeenCalled();
    });
  });

  describe('syncCreatorEngagement', () => {
    const settings: Record<string, string> = {
      BREVO_API_KEY: 'key',
      BREVO_INACTIVE_LIST_ID: '12',
      BREVO_ENGAGEMENT_EXCLUDED_EMAILS: 'Me@example.com, test@example.com',
    };

    beforeEach(() => {
      config.get.mockImplementation((key: string) => settings[key]);
      jest.mocked(syncCreatorEngagementToBrevo).mockResolvedValue({
        synced: 2,
        failed: 0,
        addedToInactiveList: 1,
        removedFromInactiveList: 0,
        inactiveListSynced: true,
      });
    });

    it('syncs creators with their ready offers and the Brevo settings', async () => {
      const creators = [{ id: 'org-1' }, { id: 'org-2' }];
      adminDashboardService.getCreatorsList.mockResolvedValue(creators as any);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { organizationId: 'org-2' },
      ] as any);

      await service.syncCreatorEngagement();

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: { in: ['org-1', 'org-2'] },
          }),
          distinct: ['organizationId'],
        }),
      );
      expect(syncCreatorEngagementToBrevo).toHaveBeenCalledWith(
        expect.objectContaining({
          creators,
          readyOrganizationIds: new Set(['org-2']),
          inactiveListId: 12,
          excludedEmails: new Set(['me@example.com', 'test@example.com']),
        }),
      );
    });

    it('does nothing without a Brevo API key', async () => {
      config.get.mockReturnValue(undefined);

      await service.syncCreatorEngagement();

      expect(adminDashboardService.getCreatorsList).not.toHaveBeenCalled();
      expect(syncCreatorEngagementToBrevo).not.toHaveBeenCalled();
    });

    it('logs instead of throwing when the creator list fails', async () => {
      adminDashboardService.getCreatorsList.mockRejectedValue(
        new Error('db down'),
      );

      await expect(service.syncCreatorEngagement()).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
