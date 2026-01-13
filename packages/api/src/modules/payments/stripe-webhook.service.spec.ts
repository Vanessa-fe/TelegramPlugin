import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentEventType,
  PaymentProvider,
  SubscriptionStatus,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { StripeWebhookService } from './stripe-webhook.service';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let prisma: jest.Mocked<PrismaService>;
  let channelAccessService: jest.Mocked<ChannelAccessService>;
  let configService: jest.Mocked<ConfigService>;

  const mockStripe = {
    webhooks: {
      constructEvent: jest.fn(),
    },
    invoices: {
      retrieve: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                STRIPE_SECRET_KEY: 'sk_test_123',
                STRIPE_WEBHOOK_SECRET: 'whsec_123',
              };
              return config[key];
            }),
            getOrThrow: jest.fn((key: string) => {
              const config: Record<string, string> = {
                STRIPE_SECRET_KEY: 'sk_test_123',
                STRIPE_WEBHOOK_SECRET: 'whsec_123',
              };
              return config[key];
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            paymentEvent: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            subscription: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ChannelAccessService,
          useValue: {
            handlePaymentSuccess: jest.fn(),
            handlePaymentFailure: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    channelAccessService = module.get(
      ChannelAccessService,
    ) as jest.Mocked<ChannelAccessService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Mock Stripe client
    (service as any).stripe = mockStripe;

    // Suppress logs during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should throw BadRequestException if webhook secret is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(
        service.handleWebhook('sig_123', { rawBody: Buffer.from('{}') }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rawBody is missing', async () => {
      await expect(service.handleWebhook('sig_123', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if signature verification fails', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleWebhook('invalid_sig', { rawBody: Buffer.from('{}') }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully process valid webhook with Buffer rawBody', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        created: 1234567890,
        data: {
          object: {
            id: 'cs_123',
            metadata: {
              organizationId: 'org-123',
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.paymentEvent.create.mockResolvedValue({
        id: 'pe-123',
        organizationId: 'org-123',
        subscriptionId: null,
        provider: PaymentProvider.STRIPE,
        type: PaymentEventType.CHECKOUT_COMPLETED,
        externalId: 'evt_123',
        payload: mockEvent as any,
        occurredAt: new Date(1234567890000),
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        'sig_123',
        'whsec_123',
      );
      expect(prisma.paymentEvent.create).toHaveBeenCalled();
      expect(prisma.paymentEvent.update).toHaveBeenCalled();
    });

    it('should successfully process valid webhook with string rawBody', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_456',
        type: 'invoice.payment_succeeded',
        created: 1234567890,
        data: {
          object: {
            id: 'in_123',
            subscription: 'sub_stripe_123',
          } as Stripe.Invoice,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-uuid-123',
        organizationId: 'org-123',
      } as any);
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.paymentEvent.create.mockResolvedValue({
        id: 'pe-456',
      } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_456', {
        rawBody: JSON.stringify(mockEvent),
      });

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        JSON.stringify(mockEvent),
        'sig_456',
        'whsec_123',
      );
    });

    it('should skip processing if event already processed', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_processed',
        type: 'invoice.payment_succeeded',
        created: 1234567890,
        data: {
          object: {
            id: 'in_123',
            metadata: { organizationId: 'org-123' },
          } as Stripe.Invoice,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.paymentEvent.findUnique.mockResolvedValue({
        id: 'pe-already-processed',
        processedAt: new Date(),
      } as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
      expect(channelAccessService.handlePaymentSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Event Type Mapping', () => {
    it('should ignore unsupported event types', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_unsupported',
        type: 'customer.created', // Unsupported type
        created: 1234567890,
        data: { object: {} as any },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('Context Resolution', () => {
    it('should resolve context from checkout session metadata', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        created: 1234567890,
        data: {
          object: {
            id: 'cs_123',
            metadata: {
              organizationId: 'org-123',
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.paymentEvent.create.mockResolvedValue({ id: 'pe-123' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.paymentEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
        }),
      });
    });

    it('should resolve context from subscription external ID', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_subscription',
        type: 'customer.subscription.created',
        created: 1234567890,
        data: {
          object: {
            id: 'sub_stripe_123',
          } as Stripe.Subscription,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-uuid-123',
        organizationId: 'org-456',
      } as any);
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.paymentEvent.create.mockResolvedValue({ id: 'pe-sub' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_sub', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { externalId: 'sub_stripe_123' },
        select: { id: true, organizationId: true },
      });
      expect(prisma.paymentEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-456',
          subscriptionId: 'sub-uuid-123',
        }),
      });
    });

    it('should skip processing if context cannot be resolved', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_no_context',
        type: 'invoice.payment_succeeded',
        created: 1234567890,
        data: {
          object: {
            id: 'in_123',
            // No metadata, no subscription
          } as Stripe.Invoice,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('Domain Side Effects', () => {
    const setupEventWithSubscription = async (
      eventType: string,
      subscriptionId = 'sub-uuid-123',
    ) => {
      const mockEvent: Stripe.Event = {
        id: `evt_${eventType}`,
        type: eventType as any,
        created: 1234567890,
        data: {
          object: {
            id: 'obj_123',
            subscription: 'sub_stripe_123',
          } as any,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.subscription.findUnique.mockResolvedValue({
        id: subscriptionId,
        organizationId: 'org-123',
      } as any);
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.paymentEvent.create.mockResolvedValue({
        id: 'pe-123',
      } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);
      prisma.subscription.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });
    };

    it('should grant access on checkout.session.completed', async () => {
      await setupEventWithSubscription('checkout.session.completed');

      expect(channelAccessService.handlePaymentSuccess).toHaveBeenCalledWith(
        'sub-uuid-123',
        PaymentProvider.STRIPE,
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-uuid-123' },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    });

    it('should grant access on customer.subscription.created', async () => {
      await setupEventWithSubscription('customer.subscription.created');

      expect(channelAccessService.handlePaymentSuccess).toHaveBeenCalledWith(
        'sub-uuid-123',
        PaymentProvider.STRIPE,
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-uuid-123' },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    });

    it('should grant access on invoice.payment_succeeded', async () => {
      await setupEventWithSubscription('invoice.payment_succeeded');

      expect(channelAccessService.handlePaymentSuccess).toHaveBeenCalledWith(
        'sub-uuid-123',
        PaymentProvider.STRIPE,
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-uuid-123' },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    });

    it('should revoke access on customer.subscription.deleted', async () => {
      await setupEventWithSubscription('customer.subscription.deleted');

      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-uuid-123',
        'canceled',
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-uuid-123' },
        data: { status: SubscriptionStatus.CANCELED },
      });
    });

    it('should revoke access on invoice.payment_failed', async () => {
      await setupEventWithSubscription('invoice.payment_failed');

      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-uuid-123',
        'payment_failed',
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-uuid-123' },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    });

    it('should revoke access on charge.refunded', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_refund',
        type: 'charge.refunded',
        created: 1234567890,
        data: {
          object: {
            id: 'ch_123',
            invoice: 'in_123',
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.invoices.retrieve.mockResolvedValue({
        id: 'in_123',
        subscription: 'sub_stripe_123',
      } as Stripe.Invoice);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-uuid-123',
        organizationId: 'org-123',
      } as any);
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.paymentEvent.create.mockResolvedValue({ id: 'pe-refund' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);
      prisma.subscription.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_refund', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        'sub-uuid-123',
        'refund',
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-uuid-123' },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    });

    it('should skip side effects if subscriptionId is missing', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_no_sub',
        type: 'checkout.session.completed',
        created: 1234567890,
        data: {
          object: {
            id: 'cs_123',
            metadata: {
              organizationId: 'org-123',
            },
            // No subscription
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.paymentEvent.create.mockResolvedValue({ id: 'pe-123' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(channelAccessService.handlePaymentSuccess).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('Metadata Resolution', () => {
    it('should resolve organizationId from various metadata fields', async () => {
      const testCases = [
        { metadata: { organizationId: 'org-1' }, expected: 'org-1' },
        { metadata: { organization_id: 'org-2' }, expected: 'org-2' },
        { metadata: { orgId: 'org-3' }, expected: 'org-3' },
        { metadata: { org_id: 'org-4' }, expected: 'org-4' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockEvent: Stripe.Event = {
          id: `evt_${testCase.expected}`,
          type: 'checkout.session.completed',
          created: 1234567890,
          data: {
            object: {
              id: 'cs_123',
              metadata: testCase.metadata,
            } as Stripe.Checkout.Session,
          },
        } as Stripe.Event;

        mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
        prisma.paymentEvent.findUnique.mockResolvedValue(null);
        prisma.paymentEvent.create.mockResolvedValue({ id: 'pe-123' } as any);
        prisma.paymentEvent.update.mockResolvedValue({} as any);

        await service.handleWebhook('sig_123', {
          rawBody: Buffer.from(JSON.stringify(mockEvent)),
        });

        expect(prisma.paymentEvent.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            organizationId: testCase.expected,
          }),
        });
      }
    });
  });
});
