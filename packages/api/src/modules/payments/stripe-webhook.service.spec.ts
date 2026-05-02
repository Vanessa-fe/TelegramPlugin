import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConversionStatus,
  PaymentEventType,
  PaymentProvider,
  SubscriptionStatus,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MetricsService } from '../metrics/metrics.service';
import { PlatformSubscriptionService } from '../platform-subscription/platform-subscription.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { VipInvitationsService } from '../vip-invitations/vip-invitations.service';

jest.mock('@telegram-plugin/shared', () => ({
  queueNames: {
    grantAccess: 'grant-access',
    revokeAccess: 'revoke-access',
    grantAccessDlq: 'grant-access-dlq',
    revokeAccessDlq: 'revoke-access-dlq',
  },
  GrantAccessPayload: {
    parse: jest.fn((value) => value),
  },
  RevokeAccessPayload: {
    parse: jest.fn((value) => value),
  },
  initPostHog: jest.fn(() => null),
  getPostHog: jest.fn(() => null),
  shutdownPostHog: jest.fn(),
  ServerEvents: {
    PLAN_SELECTED: 'plan_selected',
    SUBSCRIPTION_CREATED: 'subscription_created',
  },
}));

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let prisma: jest.Mocked<PrismaService>;
  let channelAccessService: jest.Mocked<ChannelAccessService>;
  let configService: jest.Mocked<ConfigService>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let platformSubscriptionService: jest.Mocked<PlatformSubscriptionService>;
  let analyticsService: jest.Mocked<AnalyticsService>;

  const mockStripe = {
    webhooks: {
      constructEvent: jest.fn(),
    },
    invoices: {
      retrieve: jest.fn(),
    },
    paymentIntents: {
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
              upsert: jest.fn(),
              update: jest.fn(),
            },
            subscription: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            organization: {
              findFirst: jest.fn(),
            },
            couponUsage: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            coupon: {
              update: jest.fn(),
            },
            affiliateReferral: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            affiliate: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ChannelAccessService,
          useValue: {
            handlePaymentSuccess: jest.fn(),
            handlePaymentFailure: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordWebhookRequest: jest.fn(),
            recordWebhookDuration: jest.fn(),
          },
        },
        {
          provide: PlatformSubscriptionService,
          useValue: {
            handleWebhookEvent: jest.fn(),
            updateSaasActive: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackPurchase: jest.fn(),
          },
        },
        {
          provide: VipInvitationsService,
          useValue: {
            addSalesGenerated: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
    prisma = module.get(PrismaService);
    channelAccessService = module.get(ChannelAccessService);
    configService = module.get(ConfigService);
    auditLogService = module.get(AuditLogService);
    platformSubscriptionService = module.get(PlatformSubscriptionService);
    analyticsService = module.get(AnalyticsService);
    prisma.organization.findFirst.mockResolvedValue(null);

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
        account: 'acct_123',
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
      prisma.paymentEvent.upsert.mockResolvedValue({
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
      expect(prisma.paymentEvent.upsert).toHaveBeenCalled();
      expect(prisma.paymentEvent.update).toHaveBeenCalled();
    });

    it('should successfully process valid webhook with string rawBody', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_456',
        type: 'invoice.payment_succeeded',
        account: 'acct_123',
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
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-456',
        processedAt: null,
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
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'in_123',
            metadata: { organizationId: 'org-123' },
          } as Stripe.Invoice,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-already-processed',
        processedAt: new Date(),
      } as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.paymentEvent.upsert).toHaveBeenCalled();
      expect(prisma.paymentEvent.update).not.toHaveBeenCalled();
      expect(channelAccessService.handlePaymentSuccess).not.toHaveBeenCalled();
    });

    it('should route no-account invoice events to PlatformSubscriptionService', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_platform_invoice',
        type: 'invoice.payment_succeeded',
        created: 1234567890,
        data: {
          object: {
            id: 'in_platform_123',
            subscription: 'sub_platform_123',
          } as Stripe.Invoice,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      await service.handleWebhook('sig_platform', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(platformSubscriptionService.handleWebhookEvent).toHaveBeenCalledWith(
        mockEvent,
      );
      expect(prisma.paymentEvent.upsert).not.toHaveBeenCalled();
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

      expect(prisma.paymentEvent.upsert).not.toHaveBeenCalled();
    });
  });

  describe('Context Resolution', () => {
    it('should resolve context from checkout session metadata', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        account: 'acct_123',
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
      prisma.paymentEvent.upsert.mockResolvedValue({ id: 'pe-123' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.paymentEvent.upsert).toHaveBeenCalledWith({
        create: expect.objectContaining({
          organizationId: 'org-123',
        }),
        where: expect.any(Object),
        update: expect.any(Object),
      });
    });

    it('should resolve context from subscription external ID', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_subscription',
        type: 'customer.subscription.created',
        account: 'acct_123',
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
      prisma.paymentEvent.upsert.mockResolvedValue({ id: 'pe-sub' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_sub', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { externalId: 'sub_stripe_123' },
        select: { id: true, organizationId: true },
      });
      expect(prisma.paymentEvent.upsert).toHaveBeenCalledWith({
        create: expect.objectContaining({
          organizationId: 'org-456',
          subscriptionId: 'sub-uuid-123',
        }),
        where: expect.any(Object),
        update: expect.any(Object),
      });
    });

    it('should resolve context from event account', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_account',
        type: 'invoice.payment_succeeded',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'in_123',
          } as Stripe.Invoice,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.organization.findFirst.mockResolvedValue({ id: 'org-789' } as any);
      prisma.paymentEvent.upsert.mockResolvedValue({ id: 'pe-account' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_123', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: { stripeAccountId: 'acct_123' },
        select: { id: true },
      });
      expect(prisma.paymentEvent.upsert).toHaveBeenCalledWith({
        create: expect.objectContaining({
          organizationId: 'org-789',
        }),
        where: expect.any(Object),
        update: expect.any(Object),
      });
    });

    it('should resolve internalSubscriptionId metadata as local subscription context', async () => {
      const internalSubscriptionId = '11111111-1111-4111-8111-111111111111';
      const mockEvent: Stripe.Event = {
        id: 'evt_internal_sub',
        type: 'checkout.session.completed',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'cs_123',
            metadata: {
              organizationId: 'org-123',
              internalSubscriptionId,
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      prisma.paymentEvent.upsert.mockResolvedValue({ id: 'pe-123' } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);

      await service.handleWebhook('sig_internal_sub', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.paymentEvent.upsert).toHaveBeenCalledWith({
        create: expect.objectContaining({
          organizationId: 'org-123',
          subscriptionId: internalSubscriptionId,
        }),
        where: expect.any(Object),
        update: expect.any(Object),
      });
    });

    it('should skip processing if context cannot be resolved', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_no_context',
        type: 'invoice.payment_succeeded',
        account: 'acct_123',
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

      expect(prisma.paymentEvent.upsert).not.toHaveBeenCalled();
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
        account: 'acct_123',
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
        customerId: 'cust-123',
        plan: {
          priceCents: 1000,
          currency: 'eur',
        },
      } as any);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-123',
        processedAt: null,
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
      expect(auditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'webhook.stripe.processed',
          resourceType: 'payment_event',
          resourceId: 'pe-123',
          correlationId: 'evt_checkout.session.completed',
          metadata: expect.objectContaining({
            eventId: 'evt_checkout.session.completed',
            eventType: 'checkout.session.completed',
            mappedType: PaymentEventType.CHECKOUT_COMPLETED,
            subscriptionId: 'sub-uuid-123',
          }),
        }),
      );
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
        account: 'acct_123',
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
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-refund',
        processedAt: null,
      } as any);
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
        account: 'acct_123',
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
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-123',
        processedAt: null,
      } as any);
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
          account: 'acct_123',
          created: 1234567890,
          data: {
            object: {
              id: 'cs_123',
              metadata: testCase.metadata,
            } as Stripe.Checkout.Session,
          },
        } as Stripe.Event;

        mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
        prisma.paymentEvent.upsert.mockResolvedValue({ id: 'pe-123' } as any);
        prisma.paymentEvent.update.mockResolvedValue({} as any);

        await service.handleWebhook('sig_123', {
          rawBody: Buffer.from(JSON.stringify(mockEvent)),
        });

        expect(prisma.paymentEvent.upsert).toHaveBeenCalledWith({
          create: expect.objectContaining({
            organizationId: testCase.expected,
          }),
          where: expect.any(Object),
          update: expect.any(Object),
        });
      }
    });
  });

  describe('Affiliate Referral Cancellation on Refund', () => {
    it('should cancel PENDING affiliate referral on charge.refunded via PaymentIntent metadata', async () => {
      const internalSubscriptionId = '11111111-1111-4111-8111-111111111111';
      const mockEvent: Stripe.Event = {
        id: 'evt_refund_affiliate',
        type: 'charge.refunded',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'ch_123',
            payment_intent: 'pi_123',
            metadata: {}, // Empty - metadata is on PaymentIntent
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_123',
        metadata: {
          organizationId: 'org-123',
          internalSubscriptionId,
        },
      } as Stripe.PaymentIntent);
      prisma.subscription.findUnique.mockResolvedValue({
        id: internalSubscriptionId,
        organizationId: 'org-123',
      } as any);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-refund',
        processedAt: null,
      } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);
      prisma.subscription.update.mockResolvedValue({} as any);
      prisma.affiliateReferral.findUnique.mockResolvedValue({
        id: 'ref-123',
        affiliateId: 'aff-123',
        subscriptionId: 'sub-uuid-123',
        status: ConversionStatus.PENDING,
        commissionCents: 500,
      } as any);
      prisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations);
      });

      await service.handleWebhook('sig_refund', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(
        'pi_123',
        undefined,
        { stripeAccount: 'acct_123' },
      );
      expect(channelAccessService.handlePaymentFailure).toHaveBeenCalledWith(
        internalSubscriptionId,
        'refund',
      );
      expect(prisma.affiliateReferral.findUnique).toHaveBeenCalledWith({
        where: { subscriptionId: internalSubscriptionId },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should cancel APPROVED affiliate referral and decrement pending earnings on refund', async () => {
      const internalSubscriptionId = '22222222-2222-4222-8222-222222222222';
      const mockEvent: Stripe.Event = {
        id: 'evt_refund_approved',
        type: 'charge.refunded',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'ch_approved',
            payment_intent: 'pi_approved',
            metadata: {},
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_approved',
        metadata: {
          organizationId: 'org-123',
          internalSubscriptionId,
        },
      } as Stripe.PaymentIntent);
      prisma.subscription.findUnique.mockResolvedValue({
        id: internalSubscriptionId,
        organizationId: 'org-123',
      } as any);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-refund-approved',
        processedAt: null,
      } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);
      prisma.subscription.update.mockResolvedValue({} as any);
      prisma.affiliateReferral.findUnique.mockResolvedValue({
        id: 'ref-approved',
        affiliateId: 'aff-123',
        subscriptionId: internalSubscriptionId,
        status: ConversionStatus.APPROVED,
        commissionCents: 500,
      } as any);
      prisma.affiliateReferral.update.mockReturnValue({} as any);
      prisma.affiliate.update.mockReturnValue({} as any);
      prisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations);
      });

      await service.handleWebhook('sig_refund_approved', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.affiliate.update).toHaveBeenCalledWith({
        where: { id: 'aff-123' },
        data: {
          totalEarnings: { decrement: 500 },
          pendingEarnings: { decrement: 500 },
        },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should not cancel already CANCELLED affiliate referral (idempotent)', async () => {
      const internalSubscriptionId = '33333333-3333-4333-8333-333333333333';
      const mockEvent: Stripe.Event = {
        id: 'evt_refund_already_cancelled',
        type: 'charge.refunded',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'ch_123',
            payment_intent: 'pi_123',
            metadata: {},
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_123',
        metadata: {
          organizationId: 'org-123',
          internalSubscriptionId,
        },
      } as Stripe.PaymentIntent);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-refund',
        processedAt: null,
      } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);
      prisma.subscription.update.mockResolvedValue({} as any);
      prisma.affiliateReferral.findUnique.mockResolvedValue({
        id: 'ref-123',
        affiliateId: 'aff-123',
        subscriptionId: internalSubscriptionId,
        status: ConversionStatus.CANCELLED, // Already cancelled
        commissionCents: 500,
      } as any);

      await service.handleWebhook('sig_refund', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should warn but not cancel PAID affiliate referral', async () => {
      const internalSubscriptionId = '44444444-4444-4444-8444-444444444444';
      const mockEvent: Stripe.Event = {
        id: 'evt_refund_paid',
        type: 'charge.refunded',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'ch_123',
            payment_intent: 'pi_123',
            metadata: {},
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_123',
        metadata: {
          organizationId: 'org-123',
          internalSubscriptionId,
        },
      } as Stripe.PaymentIntent);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-refund',
        processedAt: null,
      } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);
      prisma.subscription.update.mockResolvedValue({} as any);
      prisma.affiliateReferral.findUnique.mockResolvedValue({
        id: 'ref-123',
        affiliateId: 'aff-123',
        subscriptionId: internalSubscriptionId,
        status: ConversionStatus.PAID, // Already paid out
        commissionCents: 500,
      } as any);

      await service.handleWebhook('sig_refund', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      // Should not cancel - requires manual review
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle charge.refunded when no affiliate referral exists', async () => {
      const internalSubscriptionId = '55555555-5555-4555-8555-555555555555';
      const mockEvent: Stripe.Event = {
        id: 'evt_refund_no_affiliate',
        type: 'charge.refunded',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'ch_123',
            payment_intent: 'pi_123',
            metadata: {},
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_123',
        metadata: {
          organizationId: 'org-123',
          internalSubscriptionId,
        },
      } as Stripe.PaymentIntent);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-refund',
        processedAt: null,
      } as any);
      prisma.paymentEvent.update.mockResolvedValue({} as any);
      prisma.subscription.update.mockResolvedValue({} as any);
      prisma.affiliateReferral.findUnique.mockResolvedValue(null); // No referral

      await service.handleWebhook('sig_refund', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should skip refund cancellation when the webhook event was already processed', async () => {
      const internalSubscriptionId = '66666666-6666-4666-8666-666666666666';
      const mockEvent: Stripe.Event = {
        id: 'evt_refund_replay',
        type: 'charge.refunded',
        account: 'acct_123',
        created: 1234567890,
        data: {
          object: {
            id: 'ch_replay',
            payment_intent: 'pi_replay',
            metadata: {},
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_replay',
        metadata: {
          organizationId: 'org-123',
          internalSubscriptionId,
        },
      } as Stripe.PaymentIntent);
      prisma.paymentEvent.upsert.mockResolvedValue({
        id: 'pe-replay',
        processedAt: new Date(),
      } as any);

      await service.handleWebhook('sig_refund_replay', {
        rawBody: Buffer.from(JSON.stringify(mockEvent)),
      });

      expect(prisma.affiliateReferral.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('Affiliate Referral Creation', () => {
    it('should create affiliate referral from checkout metadata using affiliate commission only', async () => {
      const subscriptionId = '77777777-7777-4777-8777-777777777777';

      prisma.subscription.findUnique.mockResolvedValue({
        id: subscriptionId,
        customerId: 'cust-123',
        plan: {
          id: 'plan-123',
          priceCents: 1000,
          currency: 'eur',
          productId: 'prod-123',
        },
      } as any);
      prisma.couponUsage.findUnique.mockResolvedValue(null);
      prisma.affiliateReferral.findUnique.mockResolvedValue(null);
      prisma.affiliate.findUnique.mockResolvedValue({
        id: 'aff-123',
        commissionRate: 10,
      } as any);
      prisma.affiliateReferral.create.mockReturnValue({} as any);
      prisma.affiliate.update.mockReturnValue({} as any);
      prisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations);
      });

      await (service as any).processAffiliateAndCoupon(subscriptionId, {
        affiliateId: 'aff-123',
        affiliateCode: 'AFF10',
        affiliateClickId: '88888888-8888-4888-8888-888888888888',
        originalPriceCents: '1000',
        discountCents: '200',
        quantity: '3',
      });

      expect(prisma.affiliateReferral.create).toHaveBeenCalledWith({
        data: {
          affiliateId: 'aff-123',
          subscriptionId,
          customerId: 'cust-123',
          clickId: '88888888-8888-4888-8888-888888888888',
          productId: 'prod-123',
          amountCents: 2400,
          commissionCents: 240,
          currency: 'eur',
          status: ConversionStatus.PENDING,
        },
      });
      expect(prisma.affiliate.update).toHaveBeenCalledWith({
        where: { id: 'aff-123' },
        data: {
          totalEarnings: { increment: 240 },
          pendingEarnings: { increment: 240 },
        },
      });
    });
  });
});
