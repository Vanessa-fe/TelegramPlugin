import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { DataExportsService } from '../data-exports/data-exports.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: jest.Mocked<PrismaService>;
  let channelAccessService: jest.Mocked<ChannelAccessService>;
  let config: jest.Mocked<ConfigService>;
  let dataExportsService: jest.Mocked<DataExportsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findMany: jest.fn(),
            },
            auditLog: {
              deleteMany: jest.fn(),
            },
            paymentEvent: {
              deleteMany: jest.fn(),
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
      ],
    }).compile();

    service = module.get(SchedulerService);
    prisma = module.get(PrismaService);
    channelAccessService = module.get(ChannelAccessService);
    config = module.get(ConfigService);
    dataExportsService = module.get(DataExportsService);

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
});
