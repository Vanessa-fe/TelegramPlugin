import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  AccessStatus,
  PaymentProvider,
  ProductStatus,
  SubscriptionStatus,
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
import { ChannelAccessQueue } from '../src/modules/channel-access/channel-access.queue';
import { TelegramStarsService } from '../src/modules/payments/telegram-stars.service';

// Mock BullMQ queue to avoid Redis connections in tests
jest.mock('../src/modules/channel-access/channel-access.queue');

describe('Telegram Stars Payment Flow (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let starsService: TelegramStarsService;
  let mockQueue: jest.Mocked<ChannelAccessQueue>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    starsService = app.get(TelegramStarsService);
    mockQueue = app.get(ChannelAccessQueue);

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

  describe('createInvoice', () => {
    it('should create invoice with correct Stars conversion', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const channel = await createChannel({ organizationId: org.id });

      await prisma.productChannel.create({
        data: { productId: product.id, channelId: channel.id },
      });

      // Plan at €9.99 (999 cents) -> ~500 Stars at 2 cents per Star
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        priceCents: 999,
        currency: 'EUR',
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '123456789',
        telegramUsername: 'testuser',
        displayName: 'Test User',
      });

      expect(invoice).toBeDefined();
      expect(invoice.subscriptionId).toBeDefined();
      expect(invoice.currency).toBe('XTR');
      expect(invoice.prices).toHaveLength(1);
      expect(invoice.prices[0].amount).toBe(500); // 999 / 2 = 499.5, ceil = 500

      // Verify subscription was created
      const subscription = await prisma.subscription.findUnique({
        where: { id: invoice.subscriptionId },
      });
      expect(subscription?.status).toBe(SubscriptionStatus.INCOMPLETE);
    });

    it('should create customer if not exists', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: true,
      });

      const customersBefore = await prisma.customer.count({
        where: { organizationId: org.id },
      });

      await starsService.createInvoice(plan.id, {
        telegramUserId: '987654321',
        telegramUsername: 'newuser',
        displayName: 'New User',
      });

      const customersAfter = await prisma.customer.count({
        where: { organizationId: org.id },
      });

      expect(customersAfter).toBe(customersBefore + 1);

      const customer = await prisma.customer.findFirst({
        where: {
          organizationId: org.id,
          telegramUserId: '987654321',
        },
      });
      expect(customer?.telegramUsername).toBe('newuser');
      expect(customer?.displayName).toBe('New User');
    });

    it('should reuse existing customer', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });

      const existingCustomer = await createCustomer({
        organizationId: org.id,
        telegramUserId: '111222333',
        email: 'existing@example.com',
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '111222333',
      });

      // Verify the subscription uses existing customer
      const subscription = await prisma.subscription.findUnique({
        where: { id: invoice.subscriptionId },
      });
      expect(subscription?.customerId).toBe(existingCustomer.id);
    });

    it('should reject inactive plan', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: false,
      });

      await expect(
        starsService.createInvoice(plan.id, {
          telegramUserId: '123456789',
        }),
      ).rejects.toThrow('Plan non disponible');
    });
  });

  describe('validatePreCheckout', () => {
    it('should validate valid pre-checkout', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: true,
        priceCents: 1000,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '123456789',
      });

      const result = await starsService.validatePreCheckout(invoice.payload);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject already processed subscription', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '123456789',
      });

      // Manually mark subscription as ACTIVE (already processed)
      await prisma.subscription.update({
        where: { id: invoice.subscriptionId },
        data: { status: SubscriptionStatus.ACTIVE },
      });

      const result = await starsService.validatePreCheckout(invoice.payload);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('already processed');
    });

    it('should reject deactivated plan', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '123456789',
      });

      // Deactivate plan after invoice creation
      await prisma.plan.update({
        where: { id: plan.id },
        data: { isActive: false },
      });

      const result = await starsService.validatePreCheckout(invoice.payload);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('no longer active');
    });
  });

  describe('handleSuccessfulPayment', () => {
    it('should grant access on successful Stars payment', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
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
        priceCents: 1000, // 500 Stars
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '123456789',
        telegramUsername: 'paiduser',
      });

      // Simulate successful payment
      await starsService.handleSuccessfulPayment({
        telegramPaymentChargeId: 'tg_charge_123',
        telegramUserId: '123456789',
        totalAmount: 500, // Stars amount
        invoicePayload: invoice.payload,
      });

      // Verify subscription is now ACTIVE
      const subscription = await prisma.subscription.findUnique({
        where: { id: invoice.subscriptionId },
      });
      expect(subscription?.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription?.externalId).toBe('tg_charge_123');

      // Verify channel accesses were created
      const channelAccesses = await prisma.channelAccess.findMany({
        where: { subscriptionId: invoice.subscriptionId },
      });
      expect(channelAccesses).toHaveLength(2);
      expect(
        channelAccesses.every((a) => a.status === AccessStatus.PENDING),
      ).toBe(true);

      // Verify queue was called
      expect(mockQueue.enqueueGrantAccess).toHaveBeenCalledTimes(2);
    });

    it('should create payment event on successful payment', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        priceCents: 500, // 250 Stars
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '456789123',
      });

      await starsService.handleSuccessfulPayment({
        telegramPaymentChargeId: 'tg_charge_456',
        telegramUserId: '456789123',
        totalAmount: 250,
        invoicePayload: invoice.payload,
      });

      // Verify payment event was created
      const paymentEvent = await prisma.paymentEvent.findFirst({
        where: {
          provider: PaymentProvider.TELEGRAM_STARS,
          externalId: 'tg_charge_456',
        },
      });

      expect(paymentEvent).toBeDefined();
      expect(paymentEvent?.subscriptionId).toBe(invoice.subscriptionId);
      expect(paymentEvent?.processedAt).toBeDefined();
    });

    it('should be idempotent for duplicate payments', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        priceCents: 1000,
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '789123456',
      });

      const payload = {
        telegramPaymentChargeId: 'tg_charge_duplicate',
        telegramUserId: '789123456',
        totalAmount: 500,
        invoicePayload: invoice.payload,
      };

      // First payment
      await starsService.handleSuccessfulPayment(payload);

      // Second payment (duplicate)
      await starsService.handleSuccessfulPayment(payload);

      // Verify only one payment event exists
      const paymentEvents = await prisma.paymentEvent.findMany({
        where: {
          provider: PaymentProvider.TELEGRAM_STARS,
          externalId: 'tg_charge_duplicate',
        },
      });

      expect(paymentEvents).toHaveLength(1);
    });

    it('should reject payment amount mismatch', async () => {
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
      });
      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        priceCents: 1000, // Expected 500 Stars
        isActive: true,
      });

      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '321654987',
      });

      // Payment with wrong amount (100 Stars instead of 500)
      await expect(
        starsService.handleSuccessfulPayment({
          telegramPaymentChargeId: 'tg_charge_wrong',
          telegramUserId: '321654987',
          totalAmount: 100,
          invoicePayload: invoice.payload,
        }),
      ).rejects.toThrow('Payment amount mismatch');
    });
  });

  describe('Complete Stars Payment Flow', () => {
    it('should complete full flow: invoice -> validation -> payment -> access', async () => {
      // Setup
      const org = await createOrganization({ saasActive: true });
      const product = await createProduct({
        organizationId: org.id,
        status: ProductStatus.ACTIVE,
        name: 'Premium Access',
      });
      const channel = await createChannel({
        organizationId: org.id,
        title: 'VIP Channel',
      });

      await prisma.productChannel.create({
        data: { productId: product.id, channelId: channel.id },
      });

      const plan = await createPlan({
        productId: product.id,
        organizationId: org.id,
        priceCents: 499, // ~250 Stars
        currency: 'USD',
        interval: 'MONTH',
        isActive: true,
      });

      // Step 1: Create invoice (user clicks "Buy with Stars")
      const invoice = await starsService.createInvoice(plan.id, {
        telegramUserId: '100200300',
        telegramUsername: 'buyer',
        displayName: 'The Buyer',
      });

      expect(invoice.title).toBe(plan.name);
      expect(invoice.currency).toBe('XTR');
      expect(invoice.prices[0].amount).toBe(250); // 499 / 2 = 249.5, ceil = 250

      // Step 2: Validate pre-checkout (Telegram sends pre_checkout_query)
      const validation = await starsService.validatePreCheckout(
        invoice.payload,
      );
      expect(validation.valid).toBe(true);

      // Step 3: Process successful payment (Telegram sends successful_payment)
      await starsService.handleSuccessfulPayment({
        telegramPaymentChargeId: 'tg_full_flow_123',
        telegramUserId: '100200300',
        totalAmount: 250,
        invoicePayload: invoice.payload,
      });

      // Verify final state
      const subscription = await prisma.subscription.findUnique({
        where: { id: invoice.subscriptionId },
        include: {
          customer: true,
          plan: true,
        },
      });

      expect(subscription?.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription?.customer.telegramUserId).toBe('100200300');
      expect(subscription?.startedAt).toBeDefined();
      expect(subscription?.currentPeriodStart).toBeDefined();
      expect(subscription?.currentPeriodEnd).toBeDefined();

      // Verify channel access
      const channelAccess = await prisma.channelAccess.findFirst({
        where: { subscriptionId: invoice.subscriptionId },
      });
      expect(channelAccess?.status).toBe(AccessStatus.PENDING);
      expect(channelAccess?.channelId).toBe(channel.id);

      // Verify entitlement
      const entitlement = await prisma.entitlement.findFirst({
        where: { subscriptionId: invoice.subscriptionId },
      });
      expect(entitlement?.type).toBe('CHANNEL_ACCESS');
      expect(entitlement?.resourceId).toBe(channel.id);
    });
  });
});
