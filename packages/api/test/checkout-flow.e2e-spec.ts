import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  AccessStatus,
  PaymentProvider,
  ProductStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { ChannelAccessQueue } from '../src/modules/channel-access/channel-access.queue';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './utils/app';
import { cleanDatabase, disconnectDatabase } from './utils/database';
import {
  createChannel,
  createCustomer,
  createOrganization,
  createPlan,
  createProduct,
} from './utils/factories';

// Mock BullMQ queue to avoid Redis connections in tests
jest.mock('../src/modules/channel-access/channel-access.queue');

describe('Checkout Flow (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let mockQueue: jest.Mocked<ChannelAccessQueue>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    mockQueue = app.get(ChannelAccessQueue);

    // Setup queue mocks
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

  describe('GET /storefront/products/:id', () => {
    it('should return product with plans for active organization', async () => {
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: 'acct_test123',
      });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: true,
      });
      const channel = await createChannel({ organizationId: org.id });

      await prisma.productChannel.create({
        data: { productId: product.id, channelId: channel.id },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/storefront/products/${product.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(product.id);
      expect(body.name).toBe(product.name);
      expect(body.organization.name).toBe(org.name);
      expect(body.plans).toHaveLength(1);
      expect(body.plans[0].id).toBe(plan.id);
      expect(body.channels).toHaveLength(1);
    });

    it('should return 404 for inactive organization', async () => {
      const org = await createOrganization({
        saasActive: false,
        stripeAccountId: 'acct_test123',
      });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/storefront/products/${product.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for organization without Stripe', async () => {
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: null,
      });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/storefront/products/${product.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for draft product', async () => {
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: 'acct_test123',
      });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.DRAFT,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/storefront/products/${product.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should only return active plans', async () => {
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: 'acct_test123',
      });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: true,
        name: 'Active Plan',
      });
      await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: false,
        name: 'Inactive Plan',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/storefront/products/${product.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.plans).toHaveLength(1);
      expect(body.plans[0].name).toBe('Active Plan');
    });
  });

  describe('Complete Purchase Flow', () => {
    it('should complete full flow: checkout -> payment -> access grant', async () => {
      // Setup organization with Stripe
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: 'acct_test_complete',
      });

      // Create product with channels
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });

      const channel1 = await createChannel({
        organizationId: org.id,
        title: 'VIP Channel',
        externalId: '-1003487441463',
      });

      const channel2 = await createChannel({
        organizationId: org.id,
        title: 'Premium Channel',
        externalId: '-1009876543210',
      });

      await prisma.productChannel.createMany({
        data: [
          { productId: product.id, channelId: channel1.id },
          { productId: product.id, channelId: channel2.id },
        ],
      });

      // Create plan
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        priceCents: 999,
        currency: 'eur',
        interval: 'MONTH',
      });

      // Create customer
      const customer = await createCustomer({
        organizationId: org.id,
        email: 'buyer@example.com',
        telegramUserId: '123456789',
        telegramUsername: 'buyer',
      });

      // Create subscription (simulating post-checkout)
      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.INCOMPLETE,
          externalId: 'sub_complete_flow',
        },
      });

      // Simulate payment success webhook
      const { ChannelAccessService } = await import(
        '../src/modules/channel-access/channel-access.service'
      );
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentSuccess(
        subscription.id,
        PaymentProvider.STRIPE,
      );

      // Verify channel accesses created
      const channelAccesses = await prisma.channelAccess.findMany({
        where: { subscriptionId: subscription.id },
        include: { channel: true },
      });

      expect(channelAccesses).toHaveLength(2);
      expect(
        channelAccesses.every((a) => a.status === AccessStatus.PENDING),
      ).toBe(true);
      expect(channelAccesses.every((a) => a.customerId === customer.id)).toBe(
        true,
      );

      // Verify entitlements created
      const entitlements = await prisma.entitlement.findMany({
        where: { subscriptionId: subscription.id },
      });

      expect(entitlements).toHaveLength(2);
      expect(entitlements.every((e) => e.type === 'CHANNEL_ACCESS')).toBe(true);
      expect(entitlements.every((e) => e.customerId === customer.id)).toBe(
        true,
      );

      // Verify queue was called for each channel
      expect(mockQueue.enqueueGrantAccess).toHaveBeenCalledTimes(2);
    });

    it('should handle one-time purchase with access duration', async () => {
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: 'acct_onetime',
      });

      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });

      const channel = await createChannel({ organizationId: org.id });

      await prisma.productChannel.create({
        data: { productId: product.id, channelId: channel.id },
      });

      // One-time plan with 30 days access
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        interval: 'ONE_TIME',
        accessDurationDays: 30,
        priceCents: 4999,
      });

      const customer = await createCustomer({ organizationId: org.id });

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.INCOMPLETE,
        },
      });

      // Simulate payment
      const { ChannelAccessService } = await import(
        '../src/modules/channel-access/channel-access.service'
      );
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentSuccess(
        subscription.id,
        PaymentProvider.STRIPE,
      );

      // Verify entitlement has expiration date
      const entitlement = await prisma.entitlement.findFirst({
        where: { subscriptionId: subscription.id },
      });

      expect(entitlement).toBeDefined();
      expect(entitlement?.expiresAt).toBeDefined();

      // Check expiration is ~30 days from now
      const expectedExpiration = new Date();
      expectedExpiration.setDate(expectedExpiration.getDate() + 30);

      const diff = Math.abs(
        entitlement!.expiresAt!.getTime() - expectedExpiration.getTime(),
      );
      expect(diff).toBeLessThan(60000); // Within 1 minute tolerance
    });
  });

  describe('Access Revocation Flow', () => {
    it('should revoke all access on subscription cancellation', async () => {
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: 'acct_cancel',
      });

      const product = await createProduct({ organizationId: org.id });
      const channel1 = await createChannel({ organizationId: org.id });
      const channel2 = await createChannel({ organizationId: org.id });

      await prisma.productChannel.createMany({
        data: [
          { productId: product.id, channelId: channel1.id },
          { productId: product.id, channelId: channel2.id },
        ],
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      const customer = await createCustomer({
        organizationId: org.id,
        telegramUserId: '987654321',
      });

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // Create granted accesses
      await prisma.channelAccess.createMany({
        data: [
          {
            subscriptionId: subscription.id,
            channelId: channel1.id,
            customerId: customer.id,
            status: AccessStatus.GRANTED,
            grantedAt: new Date(),
          },
          {
            subscriptionId: subscription.id,
            channelId: channel2.id,
            customerId: customer.id,
            status: AccessStatus.GRANTED,
            grantedAt: new Date(),
          },
        ],
      });

      // Create entitlements
      await prisma.entitlement.createMany({
        data: [
          {
            subscriptionId: subscription.id,
            customerId: customer.id,
            entitlementKey: `channel:${channel1.id}`,
            type: 'CHANNEL_ACCESS',
            resourceId: channel1.id,
            grantedAt: new Date(),
          },
          {
            subscriptionId: subscription.id,
            customerId: customer.id,
            entitlementKey: `channel:${channel2.id}`,
            type: 'CHANNEL_ACCESS',
            resourceId: channel2.id,
            grantedAt: new Date(),
          },
        ],
      });

      // Simulate cancellation
      const { ChannelAccessService } = await import(
        '../src/modules/channel-access/channel-access.service'
      );
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentFailure(
        subscription.id,
        'canceled',
      );

      // Verify all channel accesses revoked
      const channelAccesses = await prisma.channelAccess.findMany({
        where: { subscriptionId: subscription.id },
      });

      expect(channelAccesses).toHaveLength(2);
      expect(
        channelAccesses.every((a) => a.status === AccessStatus.REVOKED),
      ).toBe(true);
      expect(channelAccesses.every((a) => a.revokeReason === 'canceled')).toBe(
        true,
      );

      // Verify entitlements revoked
      const entitlements = await prisma.entitlement.findMany({
        where: { subscriptionId: subscription.id },
      });

      expect(entitlements).toHaveLength(2);
      expect(entitlements.every((e) => e.revokedAt !== null)).toBe(true);
      expect(entitlements.every((e) => e.revokeReason === 'canceled')).toBe(
        true,
      );

      // Verify revoke queue was called
      expect(mockQueue.enqueueRevokeAccess).toHaveBeenCalledWith({
        subscriptionId: subscription.id,
        reason: 'canceled',
      });
    });
  });

  describe('GET /storefront/organizations/:slug/products', () => {
    it('should return all active products for organization', async () => {
      const org = await createOrganization({
        saasActive: true,
        stripeAccountId: 'acct_products',
        slug: 'test-org',
      });

      await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
        name: 'Product 1',
      });
      await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
        name: 'Product 2',
      });
      await createProduct({
        organizationId: org.id,
        status: ProductStatus.DRAFT,
        name: 'Draft Product',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/storefront/organizations/test-org/products',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
      expect(body.map((p: any) => p.name)).toEqual(
        expect.arrayContaining(['Product 1', 'Product 2']),
      );
    });

    it('should return empty array for inactive organization', async () => {
      await createOrganization({
        saasActive: false,
        stripeAccountId: 'acct_inactive',
        slug: 'inactive-org',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/storefront/organizations/inactive-org/products',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });
  });
});
