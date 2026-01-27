import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { ChannelAccessController } from './channel-access.controller';
import { ChannelAccessService } from './channel-access.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { AuthUser } from '../auth/auth.types';

describe('ChannelAccessController', () => {
  let controller: ChannelAccessController;
  let queue: jest.Mocked<ChannelAccessQueue>;
  let service: jest.Mocked<ChannelAccessService>;
  let auditLog: jest.Mocked<AuditLogService>;

  const supportUser: AuthUser = {
    userId: 'user-1',
    email: 'support@example.com',
    role: UserRole.SUPPORT,
    organizationId: null,
  };
  const adminUser: AuthUser = {
    userId: 'user-2',
    email: 'admin@example.com',
    role: UserRole.SUPERADMIN,
    organizationId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelAccessController],
      providers: [
        {
          provide: ChannelAccessService,
          useValue: {
            handlePaymentSuccess: jest.fn(),
            handlePaymentFailure: jest.fn(),
          },
        },
        {
          provide: ChannelAccessQueue,
          useValue: {
            replayGrantAccess: jest.fn(),
            replayRevokeAccess: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            createForSubscription: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ChannelAccessController);
    queue = module.get(ChannelAccessQueue);
    service = module.get(ChannelAccessService);
    auditLog = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('replayDeadLetter', () => {
    it('should replay grant DLQ jobs', async () => {
      await controller.replayDeadLetter(
        adminUser,
        {
          queue: 'grant',
          jobId: 'grant:sub-123:channel-9',
        },
        'corr-admin-1',
        'req-admin-1',
      );

      expect(queue.replayGrantAccess).toHaveBeenCalledWith(
        'grant:sub-123:channel-9',
      );
      expect(queue.replayRevokeAccess).not.toHaveBeenCalled();
      expect(auditLog.createForSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-123',
          actorId: 'user-2',
          action: 'admin.access.replay',
          resourceType: 'access_job',
          resourceId: 'grant:sub-123:channel-9',
          correlationId: 'corr-admin-1',
          metadata: {
            actorRole: UserRole.SUPERADMIN,
            queue: 'grant',
            jobId: 'grant:sub-123:channel-9',
            subscriptionId: 'sub-123',
            requestId: 'req-admin-1',
          },
        }),
      );
    });

    it('should replay revoke DLQ jobs', async () => {
      await controller.replayDeadLetter(
        adminUser,
        {
          queue: 'revoke',
          jobId: 'revoke:sub-456:refund',
        },
        'corr-admin-2',
        'req-admin-2',
      );

      expect(queue.replayRevokeAccess).toHaveBeenCalledWith(
        'revoke:sub-456:refund',
      );
      expect(queue.replayGrantAccess).not.toHaveBeenCalled();
      expect(auditLog.createForSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-456',
          actorId: 'user-2',
          action: 'admin.access.replay',
          resourceType: 'access_job',
          resourceId: 'revoke:sub-456:refund',
          correlationId: 'corr-admin-2',
          metadata: {
            actorRole: UserRole.SUPERADMIN,
            queue: 'revoke',
            jobId: 'revoke:sub-456:refund',
            subscriptionId: 'sub-456',
            requestId: 'req-admin-2',
          },
        }),
      );
    });
  });

  describe('supportGrantAccess', () => {
    it('should grant access and log audit entry', async () => {
      await controller.supportGrantAccess(
        supportUser,
        {
          subscriptionId: 'sub-123',
        },
        'corr-support-1',
        'req-support-1',
      );

      expect(service.handlePaymentSuccess).toHaveBeenCalledWith(
        'sub-123',
        'STRIPE',
      );
      expect(auditLog.createForSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-123',
          actorId: 'user-1',
          action: 'support.access.grant',
          resourceType: 'subscription',
          resourceId: 'sub-123',
          correlationId: 'corr-support-1',
          metadata: {
            actorRole: UserRole.SUPPORT,
            requestId: 'req-support-1',
          },
        }),
      );
    });
  });

  describe('supportRevokeAccess', () => {
    it('should revoke access and log audit entry', async () => {
      await controller.supportRevokeAccess(
        supportUser,
        {
          subscriptionId: 'sub-456',
          reason: 'manual',
        },
        'corr-support-2',
        'req-support-2',
      );

      expect(service.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-456',
        'canceled',
      );
      expect(auditLog.createForSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-456',
          actorId: 'user-1',
          action: 'support.access.revoke',
          resourceType: 'subscription',
          resourceId: 'sub-456',
          correlationId: 'corr-support-2',
          metadata: {
            reason: 'manual',
            actorRole: UserRole.SUPPORT,
            requestId: 'req-support-2',
          },
        }),
      );
    });
  });

  describe('supportReplayDeadLetter', () => {
    it('should replay grant DLQ jobs and log audit entry', async () => {
      await controller.supportReplayDeadLetter(
        supportUser,
        {
          queue: 'grant',
          jobId: 'grant:sub-789:channel-1',
        },
        'corr-support-3',
        'req-support-3',
      );

      expect(queue.replayGrantAccess).toHaveBeenCalledWith(
        'grant:sub-789:channel-1',
      );
      expect(queue.replayRevokeAccess).not.toHaveBeenCalled();
      expect(auditLog.createForSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-789',
          actorId: 'user-1',
          action: 'support.access.replay',
          resourceType: 'access_job',
          resourceId: 'grant:sub-789:channel-1',
          correlationId: 'corr-support-3',
          metadata: {
            actorRole: UserRole.SUPPORT,
            queue: 'grant',
            jobId: 'grant:sub-789:channel-1',
            subscriptionId: 'sub-789',
            requestId: 'req-support-3',
          },
        }),
      );
    });

    it('should replay revoke DLQ jobs and log audit entry', async () => {
      await controller.supportReplayDeadLetter(
        supportUser,
        {
          queue: 'revoke',
          jobId: 'revoke:sub-321:refund',
        },
        'corr-support-4',
        'req-support-4',
      );

      expect(queue.replayRevokeAccess).toHaveBeenCalledWith(
        'revoke:sub-321:refund',
      );
      expect(queue.replayGrantAccess).not.toHaveBeenCalled();
      expect(auditLog.createForSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-321',
          actorId: 'user-1',
          action: 'support.access.replay',
          resourceType: 'access_job',
          resourceId: 'revoke:sub-321:refund',
          correlationId: 'corr-support-4',
          metadata: {
            actorRole: UserRole.SUPPORT,
            queue: 'revoke',
            jobId: 'revoke:sub-321:refund',
            subscriptionId: 'sub-321',
            requestId: 'req-support-4',
          },
        }),
      );
    });
  });
});
