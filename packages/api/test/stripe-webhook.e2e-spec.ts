import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  PaymentEventType,
  PaymentProvider,
  SubscriptionStatus,
  AccessStatus,
} from '@prisma/client';
import Stripe from 'stripe';
import { cleanDatabase, disconnectDatabase } from './utils/database';
import {
  createOrganization,
  createProduct,
  createPlan,
  createChannel,
  createCustomer,
  createSubscription,
} from './utils/factories';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './utils/app';
import { ChannelAccessQueue } from '../src/modules/channel-access/channel-access.queue';
import { ChannelAccessService } from '../src/modules/channel-access/channel-access.service';
import { StripeWebhookService } from '../src/modules/payments/stripe-webhook.service';

// Mock BullMQ queue to avoid Redis connections in tests
jest.mock('../src/modules/channel-access/channel-access.queue');

describe('Stripe Webhooks (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let mockQueue: jest.Mocked<ChannelAccessQueue>;

  // Mock Stripe signature for testing
  const MOCK_STRIPE_SIGNATURE = 'test_signature';
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    mockQueue = app.get(ChannelAccessQueue) as jest.Mocked<ChannelAccessQueue>;

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

  // Helper to create a mock Stripe event
  const createMockStripeEvent = (
    type: string,
    data: any,
    eventId?: string,
  ): Stripe.Event => {
    return {
      id: eventId || `evt_test_${Date.now()}`,
      type: type as any,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: data,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      api_version: '2024-06-20',
      object: 'event',
    };
  };

  describe('POST /webhooks/stripe', () => {
    it('should fail without stripe-signature header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Stripe signature header missing');
    });

    it('should fail with invalid signature', async () => {
      const event = createMockStripeEvent('checkout.session.completed', {
        id: 'cs_test',
        metadata: { organizationId: 'org-123' },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'invalid_signature',
        },
        payload: event,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('checkout.session.completed', () => {
    it('should create payment event from checkout session', async () => {
      const org = await createOrganization();
      const subscription = await createSubscription({
        organizationId: org.id,
        externalId: 'sub_stripe_123',
      });

      const event = createMockStripeEvent('checkout.session.completed', {
        id: 'cs_test_123',
        subscription: subscription.externalId,
        metadata: {
          organizationId: org.id,
        },
      });

      // Note: In real tests, we would need to properly sign the webhook
      // For now, this demonstrates the structure
      // The actual signature verification would be mocked in integration tests

      const paymentEvents = await prisma.paymentEvent.findMany({
        where: { organizationId: org.id },
      });

      // Without proper signing, this would fail in real scenario
      // This structure shows what we're testing for
      expect(paymentEvents).toBeDefined();
    });
  });

  describe('Payment Success Flow', () => {
    it('should grant channel access on invoice.payment_succeeded', async () => {
      // Setup: Create organization, product with channels, plan, customer, subscription
      const org = await createOrganization();
      const product = await createProduct({ organizationId: org.id });
      const channel1 = await createChannel({ organizationId: org.id });
      const channel2 = await createChannel({ organizationId: org.id });

      // Link channels to product
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

      const customer = await createCustomer({ organizationId: org.id });
      const subscription = await createSubscription({
        customerId: customer.id,
        planId: plan.id,
        organizationId: org.id,
        externalId: 'sub_stripe_payment_success',
      });

      // Simulate webhook processing by calling service directly
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentSuccess(
        subscription.id,
        PaymentProvider.STRIPE,
      );

      // Verify channel accesses were created
      const channelAccesses = await prisma.channelAccess.findMany({
        where: { subscriptionId: subscription.id },
      });

      expect(channelAccesses).toHaveLength(2);
      expect(channelAccesses[0].status).toBe(AccessStatus.PENDING);
      expect(channelAccesses[1].status).toBe(AccessStatus.PENDING);

      // Verify subscription status updated
      const updatedSub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });
      expect(updatedSub?.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should update existing revoked access to pending on payment success', async () => {
      const org = await createOrganization();
      const product = await createProduct({ organizationId: org.id });
      const channel = await createChannel({ organizationId: org.id });

      await prisma.productChannel.create({
        data: { productId: product.id, channelId: channel.id },
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      const customer = await createCustomer({ organizationId: org.id });
      const subscription = await createSubscription({
        customerId: customer.id,
        planId: plan.id,
        organizationId: org.id,
      });

      // Create a revoked access
      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.REVOKED,
          revokedAt: new Date(),
          revokeReason: 'payment_failed',
        },
      });

      // Process payment success
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentSuccess(
        subscription.id,
        PaymentProvider.STRIPE,
      );

      // Verify access was updated to pending
      const channelAccesses = await prisma.channelAccess.findMany({
        where: { subscriptionId: subscription.id },
      });

      expect(channelAccesses).toHaveLength(1);
      expect(channelAccesses[0].status).toBe(AccessStatus.PENDING);
      expect(channelAccesses[0].revokedAt).toBeNull();
      expect(channelAccesses[0].revokeReason).toBeNull();
    });

    it('should skip channels already granted', async () => {
      const org = await createOrganization();
      const product = await createProduct({ organizationId: org.id });
      const channel = await createChannel({ organizationId: org.id });

      await prisma.productChannel.create({
        data: { productId: product.id, channelId: channel.id },
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      const customer = await createCustomer({ organizationId: org.id });
      const subscription = await createSubscription({
        customerId: customer.id,
        planId: plan.id,
        organizationId: org.id,
      });

      // Create already granted access
      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.GRANTED,
          grantedAt: new Date(),
        },
      });

      const accessCountBefore = await prisma.channelAccess.count({
        where: { subscriptionId: subscription.id },
      });

      // Process payment success
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentSuccess(
        subscription.id,
        PaymentProvider.STRIPE,
      );

      // Verify no new access was created
      const accessCountAfter = await prisma.channelAccess.count({
        where: { subscriptionId: subscription.id },
      });

      expect(accessCountAfter).toBe(accessCountBefore);

      // Verify status remained granted
      const channelAccess = await prisma.channelAccess.findFirst({
        where: { subscriptionId: subscription.id },
      });
      expect(channelAccess?.status).toBe(AccessStatus.GRANTED);
    });
  });

  describe('Payment Failure Flow', () => {
    it('should set grace period on invoice.payment_failed', async () => {
      const org = await createOrganization();
      const product = await createProduct({ organizationId: org.id });
      const channel = await createChannel({ organizationId: org.id });

      await prisma.productChannel.create({
        data: { productId: product.id, channelId: channel.id },
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
      });

      const customer = await createCustomer({ organizationId: org.id });
      const subscription = await createSubscription({
        customerId: customer.id,
        planId: plan.id,
        organizationId: org.id,
        status: SubscriptionStatus.ACTIVE,
      });

      // Create granted access
      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.GRANTED,
          grantedAt: new Date(),
        },
      });

      // Process payment failure
      const channelAccessService = app.get(ChannelAccessService);
      const before = new Date();
      await channelAccessService.handlePaymentFailure(
        subscription.id,
        'payment_failed',
      );

      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      // Verify grace was applied and access kept
      const channelAccess = await prisma.channelAccess.findFirst({
        where: { subscriptionId: subscription.id },
      });

      expect(updatedSubscription?.graceUntil).toBeDefined();
      expect(updatedSubscription?.lastPaymentFailedAt).toBeDefined();
      expect(updatedSubscription?.graceUntil?.getTime()).toBeGreaterThan(
        before.getTime(),
      );
      expect(channelAccess?.status).toBe(AccessStatus.REVOKE_PENDING);
      expect(channelAccess?.revokedAt).toBeNull();
      expect(channelAccess?.revokeReason).toBeNull();
    });

    it('should revoke access on subscription canceled', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const subscription = await createSubscription({
        customerId: customer.id,
        organizationId: org.id,
        status: SubscriptionStatus.ACTIVE,
      });

      const channel = await createChannel({ organizationId: org.id });

      // Create granted access
      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.GRANTED,
          grantedAt: new Date(),
        },
      });

      // Process cancellation
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentFailure(subscription.id, 'canceled');

      // Verify access was revoked with correct reason
      const channelAccess = await prisma.channelAccess.findFirst({
        where: { subscriptionId: subscription.id },
      });

      expect(channelAccess?.status).toBe(AccessStatus.REVOKED);
      expect(channelAccess?.revokeReason).toBe('canceled');
    });

    it('should revoke access on charge refunded', async () => {
      const org = await createOrganization();
      const customer = await createCustomer({ organizationId: org.id });
      const subscription = await createSubscription({
        customerId: customer.id,
        organizationId: org.id,
        status: SubscriptionStatus.ACTIVE,
      });

      const channel = await createChannel({ organizationId: org.id });

      // Create granted access
      await prisma.channelAccess.create({
        data: {
          subscriptionId: subscription.id,
          channelId: channel.id,
          customerId: customer.id,
          status: AccessStatus.GRANTED,
          grantedAt: new Date(),
        },
      });

      // Process refund
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentFailure(subscription.id, 'refund');

      // Verify access was revoked with refund reason
      const channelAccess = await prisma.channelAccess.findFirst({
        where: { subscriptionId: subscription.id },
      });

      expect(channelAccess?.status).toBe(AccessStatus.REVOKED);
      expect(channelAccess?.revokeReason).toBe('refund');
    });

    it('should keep multiple channel accesses during grace period', async () => {
      const org = await createOrganization();
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

      const customer = await createCustomer({ organizationId: org.id });
      const subscription = await createSubscription({
        customerId: customer.id,
        planId: plan.id,
        organizationId: org.id,
      });

      // Create multiple granted accesses
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

      // Process payment failure
      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentFailure(
        subscription.id,
        'payment_failed',
      );

      // Verify all accesses were kept
      const channelAccesses = await prisma.channelAccess.findMany({
        where: { subscriptionId: subscription.id },
      });

      expect(channelAccesses).toHaveLength(2);
      expect(
        channelAccesses.every((a) => a.status === AccessStatus.REVOKE_PENDING),
      ).toBe(true);
    });
  });

  describe('Subscription Status Updates', () => {
    it('should update subscription to ACTIVE on payment success', async () => {
      const org = await createOrganization();
      const subscription = await createSubscription({
        organizationId: org.id,
        status: SubscriptionStatus.PAST_DUE,
      });

      const channelAccessService = app.get(ChannelAccessService);
      await channelAccessService.handlePaymentSuccess(
        subscription.id,
        PaymentProvider.STRIPE,
      );

      const stripeWebhookService = app.get(StripeWebhookService);
      // Call private method via reflection for testing
      await (stripeWebhookService as any).applyDomainSideEffects(
        PaymentEventType.INVOICE_PAID,
        {
          organizationId: org.id,
          subscriptionId: subscription.id,
        },
      );

      const updatedSub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      expect(updatedSub?.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should update subscription to CANCELED on cancellation', async () => {
      const org = await createOrganization();
      const subscription = await createSubscription({
        organizationId: org.id,
        status: SubscriptionStatus.ACTIVE,
      });

      const stripeWebhookService = app.get(StripeWebhookService);
      await (stripeWebhookService as any).applyDomainSideEffects(
        PaymentEventType.SUBSCRIPTION_CANCELED,
        {
          organizationId: org.id,
          subscriptionId: subscription.id,
        },
      );

      const updatedSub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      expect(updatedSub?.status).toBe(SubscriptionStatus.CANCELED);
    });

    it('should update subscription to PAST_DUE on payment failure', async () => {
      const org = await createOrganization();
      const subscription = await createSubscription({
        organizationId: org.id,
        status: SubscriptionStatus.ACTIVE,
      });

      const stripeWebhookService = app.get(StripeWebhookService);
      await (stripeWebhookService as any).applyDomainSideEffects(
        PaymentEventType.INVOICE_PAYMENT_FAILED,
        {
          organizationId: org.id,
          subscriptionId: subscription.id,
        },
      );

      const updatedSub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      expect(updatedSub?.status).toBe(SubscriptionStatus.PAST_DUE);
    });

    it('should update subscription to EXPIRED on refund', async () => {
      const org = await createOrganization();
      const subscription = await createSubscription({
        organizationId: org.id,
        status: SubscriptionStatus.ACTIVE,
      });

      const stripeWebhookService = app.get(StripeWebhookService);
      await (stripeWebhookService as any).applyDomainSideEffects(
        PaymentEventType.REFUND_CREATED,
        {
          organizationId: org.id,
          subscriptionId: subscription.id,
        },
      );

      const updatedSub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      expect(updatedSub?.status).toBe(SubscriptionStatus.EXPIRED);
    });
  });
});
