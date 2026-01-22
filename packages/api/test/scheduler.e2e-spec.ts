import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  AccessStatus,
  SubscriptionStatus,
  EntitlementType,
} from '@prisma/client';
import { cleanDatabase, disconnectDatabase } from './utils/database';
import {
  createOrganization,
  createProduct,
  createPlan,
  createChannel,
  createCustomer,
} from './utils/factories';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './utils/app';
import { SchedulerService } from '../src/modules/scheduler/scheduler.service';
import { ChannelAccessQueue } from '../src/modules/channel-access/channel-access.queue';

// Mock BullMQ queue to avoid Redis connections in tests
jest.mock('../src/modules/channel-access/channel-access.queue');

describe('Scheduler Service (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let schedulerService: SchedulerService;
  let mockQueue: jest.Mocked<ChannelAccessQueue>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    schedulerService = app.get(SchedulerService);
    mockQueue = app.get(ChannelAccessQueue) as jest.Mocked<ChannelAccessQueue>;

    mockQueue.enqueueGrantAccess = jest.fn().mockResolvedValue(undefined);
    mockQueue.enqueueRevokeAccess = jest.fn().mockResolvedValue(undefined);
  });

  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await app.close();
  });

  describe('handleExpiredEntitlements', () => {
    it('should revoke expired entitlements', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // Create expired entitlement (expired 1 hour ago)
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);

      await prisma.entitlement.create({
        data: {
          subscriptionId: subscription.id,
          customerId: customer.id,
          entitlementKey: 'test:expired',
          type: EntitlementType.CHANNEL_ACCESS,
          grantedAt: new Date(expiredDate.getTime() - 86400000), // Granted yesterday
          expiresAt: expiredDate,
        },
      });

      // Create non-expired entitlement (expires tomorrow)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await prisma.entitlement.create({
        data: {
          subscriptionId: subscription.id,
          customerId: customer.id,
          entitlementKey: 'test:active',
          type: EntitlementType.CHANNEL_ACCESS,
          grantedAt: new Date(),
          expiresAt: futureDate,
        },
      });

      // Run scheduler
      await schedulerService.handleExpiredEntitlements();

      // Verify expired entitlement was revoked
      const expiredEntitlement = await prisma.entitlement.findFirst({
        where: { entitlementKey: 'test:expired' },
      });
      expect(expiredEntitlement?.revokedAt).toBeDefined();
      expect(expiredEntitlement?.revokeReason).toBe('expired');

      // Verify active entitlement was not touched
      const activeEntitlement = await prisma.entitlement.findFirst({
        where: { entitlementKey: 'test:active' },
      });
      expect(activeEntitlement?.revokedAt).toBeNull();
    });

    it('should not revoke already revoked entitlements', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.CANCELED,
        },
      });

      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);

      const revokedDate = new Date();
      revokedDate.setHours(revokedDate.getHours() - 2);

      await prisma.entitlement.create({
        data: {
          subscriptionId: subscription.id,
          customerId: customer.id,
          entitlementKey: 'test:already-revoked',
          type: EntitlementType.CHANNEL_ACCESS,
          grantedAt: new Date(expiredDate.getTime() - 86400000),
          expiresAt: expiredDate,
          revokedAt: revokedDate,
          revokeReason: 'canceled',
        },
      });

      // Run scheduler
      await schedulerService.handleExpiredEntitlements();

      // Verify revoke reason was not changed
      const entitlement = await prisma.entitlement.findFirst({
        where: { entitlementKey: 'test:already-revoked' },
      });
      expect(entitlement?.revokeReason).toBe('canceled');
    });
  });

  describe('handleExpiredChannelAccesses', () => {
    it('should revoke channel access for canceled subscriptions with past period', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const channel = await createChannel({ organizationId: org.id });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        interval: 'MONTH',
      });

      // Subscription with period that ended yesterday
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() - 1);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.CANCELED,
          currentPeriodEnd: periodEnd,
        },
      });

      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.GRANTED,
          grantedAt: new Date(),
        },
      });

      // Run scheduler
      await schedulerService.handleExpiredChannelAccesses();

      // Verify revoke was called
      expect(mockQueue.enqueueRevokeAccess).toHaveBeenCalledWith({
        subscriptionId: subscription.id,
        reason: 'expired',
      });
    });

    it('should revoke one-time purchase access after duration expires', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const channel = await createChannel({ organizationId: org.id });

      // One-time plan with 7 days access
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        interval: 'ONE_TIME',
        accessDurationDays: 7,
      });

      // Subscription started 10 days ago (should be expired)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          startedAt: startDate,
        },
      });

      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.GRANTED,
          grantedAt: startDate,
        },
      });

      // Run scheduler
      await schedulerService.handleExpiredChannelAccesses();

      // Verify revoke was called
      expect(mockQueue.enqueueRevokeAccess).toHaveBeenCalledWith({
        subscriptionId: subscription.id,
        reason: 'expired',
      });
    });

    it('should not revoke one-time purchase within duration', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const channel = await createChannel({ organizationId: org.id });

      // One-time plan with 30 days access
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        interval: 'ONE_TIME',
        accessDurationDays: 30,
      });

      // Subscription started 5 days ago (still valid)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          startedAt: startDate,
        },
      });

      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.GRANTED,
          grantedAt: startDate,
        },
      });

      // Run scheduler
      await schedulerService.handleExpiredChannelAccesses();

      // Verify revoke was NOT called
      expect(mockQueue.enqueueRevokeAccess).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOldInvites', () => {
    it('should delete old revoked invites', async () => {
      const org = await createOrganization();
      const channel = await createChannel({ organizationId: org.id });

      // Create old revoked invite (40 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);

      await prisma.telegramInvite.create({
        data: {
          channelId: channel.id,
          inviteLink: 'https://t.me/+old123',
          status: 'REVOKED',
          revokedAt: oldDate,
        },
      });

      // Create recent revoked invite (5 days ago)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      await prisma.telegramInvite.create({
        data: {
          channelId: channel.id,
          inviteLink: 'https://t.me/+recent123',
          status: 'REVOKED',
          revokedAt: recentDate,
        },
      });

      // Create active invite
      await prisma.telegramInvite.create({
        data: {
          channelId: channel.id,
          inviteLink: 'https://t.me/+active123',
          status: 'ACTIVE',
        },
      });

      // Run cleanup
      await schedulerService.cleanupOldInvites();

      // Verify old invite was deleted
      const invites = await prisma.telegramInvite.findMany({
        where: { channelId: channel.id },
      });

      expect(invites).toHaveLength(2);
      expect(invites.map((i) => i.inviteLink)).toEqual(
        expect.arrayContaining([
          'https://t.me/+recent123',
          'https://t.me/+active123',
        ]),
      );
    });
  });

  describe('sendExpirationReminders', () => {
    it('should mark subscriptions expiring in 3 days for reminder', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      // Subscription expiring in 3.5 days
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 3);
      periodEnd.setHours(periodEnd.getHours() + 12);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: periodEnd,
        },
      });

      // Run reminder check
      await schedulerService.sendExpirationReminders();

      // Verify subscription was marked
      const updated = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      const metadata = updated?.metadata as Record<string, unknown>;
      expect(metadata?.expirationReminderSent).toBe(true);
    });

    it('should not re-send reminder if already sent', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 3);
      periodEnd.setHours(periodEnd.getHours() + 12);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: periodEnd,
          metadata: {
            expirationReminderSent: true,
            expirationReminderSentAt: new Date().toISOString(),
          },
        },
      });

      // Run reminder check
      await schedulerService.sendExpirationReminders();

      // Verify metadata was not changed
      const updated = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      const metadata = updated?.metadata as Record<string, unknown>;
      expect(metadata?.expirationReminderSent).toBe(true);
      // Timestamp should remain the same (not updated)
    });

    it('should not mark subscriptions expiring in more than 4 days', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const product = await createProduct({ organizationId: org.id });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      // Subscription expiring in 7 days
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 7);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: periodEnd,
        },
      });

      // Run reminder check
      await schedulerService.sendExpirationReminders();

      // Verify subscription was not marked
      const updated = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      expect(updated?.metadata).toBeNull();
    });
  });
});
