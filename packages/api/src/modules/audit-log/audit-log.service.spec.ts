import { Test, TestingModule } from '@nestjs/testing';
import { AuditActorType } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create audit log with defaults', async () => {
      await service.create({
        organizationId: 'org-1',
        actorId: 'user-1',
        action: 'support.access.grant',
        resourceType: 'subscription',
        resourceId: 'sub-1',
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          actorId: 'user-1',
          actorType: AuditActorType.USER,
          action: 'support.access.grant',
          resourceType: 'subscription',
          resourceId: 'sub-1',
          metadata: undefined,
        }),
      });
    });

    it('should honor explicit actor type', async () => {
      await service.create({
        organizationId: 'org-2',
        actorId: null,
        actorType: AuditActorType.SYSTEM,
        action: 'system.access.replay',
        resourceType: 'access_job',
        resourceId: 'job-1',
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-2',
          actorId: null,
          actorType: AuditActorType.SYSTEM,
          action: 'system.access.replay',
          resourceType: 'access_job',
          resourceId: 'job-1',
        }),
      });
    });

    it('should include correlation id when provided', async () => {
      await service.create({
        organizationId: 'org-3',
        actorId: 'user-3',
        action: 'support.access.revoke',
        resourceType: 'subscription',
        resourceId: 'sub-3',
        correlationId: 'corr-123',
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-3',
          actorId: 'user-3',
          correlationId: 'corr-123',
        }),
      });
    });
  });

  describe('createForSubscription', () => {
    it('should resolve organization and create audit log', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue({
        organizationId: 'org-3',
      });

      await service.createForSubscription({
        subscriptionId: 'sub-3',
        actorId: 'user-3',
        action: 'support.access.revoke',
        resourceType: 'subscription',
        resourceId: 'sub-3',
        metadata: { reason: 'manual' },
        correlationId: 'corr-456',
      });

      expect(mockPrismaService.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 'sub-3' },
        select: { organizationId: true },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-3',
          actorId: 'user-3',
          actorType: AuditActorType.USER,
          action: 'support.access.revoke',
          resourceType: 'subscription',
          resourceId: 'sub-3',
          metadata: { reason: 'manual' },
          correlationId: 'corr-456',
        }),
      });
    });

    it('should skip when subscription is missing', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);

      await service.createForSubscription({
        subscriptionId: 'missing-sub',
        actorId: 'user-4',
        action: 'support.access.replay',
        resourceType: 'access_job',
        resourceId: 'job-2',
      });

      expect(mockPrismaService.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-sub' },
        select: { organizationId: true },
      });
      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
