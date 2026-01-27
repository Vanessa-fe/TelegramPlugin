import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, SubscriptionStatus, UserRole } from '@prisma/client';
import { DataDeletionsService } from './data-deletions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('DataDeletionsService', () => {
  let service: DataDeletionsService;
  let prisma: jest.Mocked<PrismaService>;
  let channelAccess: jest.Mocked<ChannelAccessService>;
  let auditLog: jest.Mocked<AuditLogService>;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    paymentEvent: {
      updateMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    plan: {
      updateMany: jest.fn(),
    },
    channel: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataDeletionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ChannelAccessService,
          useValue: {
            handlePaymentFailure: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DataDeletionsService);
    prisma = module.get(PrismaService);
    channelAccess = module.get(ChannelAccessService);
    auditLog = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('deleteCustomer', () => {
    it('should anonymize customer and revoke subscriptions', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-04-01T00:00:00Z'));

      prisma.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-1',
        deletedAt: null,
      } as any);
      prisma.subscription.findMany.mockResolvedValue([
        { id: 'sub-1' },
        { id: 'sub-2' },
      ] as any);
      prisma.subscription.update.mockResolvedValue({} as any);
      prisma.paymentEvent.updateMany.mockResolvedValue({ count: 2 } as any);
      prisma.customer.update.mockResolvedValue({} as any);

      await service.deleteCustomer({
        organizationId: 'org-1',
        customerId: 'cust-1',
        actorId: 'user-1',
        actorRole: UserRole.ORG_ADMIN,
        correlationId: 'corr-1',
        requestId: 'req-1',
      });

      expect(channelAccess.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-1',
        'canceled',
      );
      expect(channelAccess.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-2',
        'canceled',
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date('2026-04-01T00:00:00Z'),
          endedAt: new Date('2026-04-01T00:00:00Z'),
        }),
      });
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: expect.objectContaining({
          email: null,
          displayName: null,
          telegramUserId: null,
          telegramUsername: null,
          externalId: null,
          metadata: Prisma.DbNull,
          deletedAt: new Date('2026-04-01T00:00:00Z'),
        }),
      });
      expect(prisma.paymentEvent.updateMany).toHaveBeenCalledWith({
        where: {
          subscriptionId: { in: ['sub-1', 'sub-2'] },
        },
        data: {
          payload: {},
        },
      });
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          actorId: 'user-1',
          action: 'rgpd.customer.deleted',
          resourceType: 'customer',
          resourceId: 'cust-1',
          correlationId: 'corr-1',
          metadata: expect.objectContaining({
            requestId: 'req-1',
            actorRole: UserRole.ORG_ADMIN,
            subscriptionsRevoked: 2,
          }),
        }),
      );
    });
  });

  describe('deleteOrganization', () => {
    it('should anonymize organization and cascade customer deletions', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-04-01T00:00:00Z'));

      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-2',
        deletedAt: null,
        name: 'Org 2',
        slug: 'org-2',
        billingEmail: 'billing@org2.com',
      } as any);
      prisma.customer.findMany.mockResolvedValue([
        { id: 'cust-2' },
        { id: 'cust-3' },
      ] as any);
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-2' },
        { id: 'user-3' },
      ] as any);
      prisma.product.findMany.mockResolvedValue([
        { id: 'prod-1' },
        { id: 'prod-2' },
      ] as any);
      prisma.product.updateMany.mockResolvedValue({ count: 2 } as any);
      prisma.plan.updateMany.mockResolvedValue({ count: 3 } as any);
      prisma.channel.updateMany.mockResolvedValue({ count: 1 } as any);
      prisma.organization.update.mockResolvedValue({} as any);
      prisma.user.update.mockResolvedValue({} as any);

      const deleteCustomerSpy = jest
        .spyOn(service, 'deleteCustomer')
        .mockResolvedValue();

      await service.deleteOrganization({
        organizationId: 'org-2',
        actorId: 'user-1',
        actorRole: UserRole.SUPERADMIN,
        correlationId: 'corr-org',
        requestId: 'req-org',
      });

      expect(deleteCustomerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-2',
          customerId: 'cust-2',
        }),
      );
      expect(deleteCustomerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-2',
          customerId: 'cust-3',
        }),
      );
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-2' },
        data: { status: 'ARCHIVED' },
      });
      expect(prisma.plan.updateMany).toHaveBeenCalledWith({
        where: { productId: { in: ['prod-1', 'prod-2'] } },
        data: { isActive: false },
      });
      expect(prisma.channel.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-2' },
        data: { isActive: false },
      });
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-2' },
        data: expect.objectContaining({
          name: expect.stringContaining('Deleted'),
          slug: expect.stringContaining('deleted-'),
          billingEmail: expect.stringContaining('@example.invalid'),
          saasActive: false,
          stripeAccountId: null,
          deletedAt: new Date('2026-04-01T00:00:00Z'),
        }),
      });
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-2',
          actorId: 'user-1',
          action: 'rgpd.organization.deleted',
          resourceType: 'organization',
          resourceId: 'org-2',
          correlationId: 'corr-org',
          metadata: expect.objectContaining({
            requestId: 'req-org',
            actorRole: UserRole.SUPERADMIN,
            customersDeleted: 2,
            usersDeactivated: 2,
          }),
        }),
      );
    });
  });
});
