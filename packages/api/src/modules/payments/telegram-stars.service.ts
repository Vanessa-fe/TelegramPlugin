import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaymentEventType,
  PaymentProvider,
  ProductStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { ChannelAccessService } from '../channel-access/channel-access.service';

// Default conversion rate: 1 Star = 2 cents USD (approximate Telegram rate)
const DEFAULT_STARS_CONVERSION_RATE = 2;

export interface TelegramStarsPayload {
  telegramPaymentChargeId: string;
  telegramUserId: string;
  totalAmount: number; // in stars
  invoicePayload: string; // Custom payload we sent
  providerPaymentChargeId?: string;
}

export interface TelegramStarsCustomerInput {
  telegramUserId: string;
  telegramUsername?: string;
  displayName?: string;
}

export interface TelegramStarsInvoice {
  subscriptionId: string;
  title: string;
  description: string;
  payload: string;
  currency: 'XTR';
  prices: Array<{ label: string; amount: number }>;
}

@Injectable()
export class TelegramStarsService {
  private readonly logger = new Logger(TelegramStarsService.name);
  private readonly starsConversionRate: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelAccessService: ChannelAccessService,
    private readonly config: ConfigService,
  ) {
    // Conversion rate: how many cents = 1 Star
    // Default: 2 cents per star (so $1 = 50 stars, €10 = ~500 stars)
    this.starsConversionRate =
      this.config.get<number>('TELEGRAM_STARS_CONVERSION_RATE') ??
      DEFAULT_STARS_CONVERSION_RATE;
  }

  /**
   * Converts price in cents to Telegram Stars
   */
  private convertCentsToStars(priceCents: number): number {
    return Math.ceil(priceCents / this.starsConversionRate);
  }

  /**
   * Converts Telegram Stars to price in cents
   */
  private convertStarsToCents(stars: number): number {
    return stars * this.starsConversionRate;
  }

  /**
   * Handles successful Telegram Stars payment
   * This is called when we receive a successful_payment update from Telegram
   */
  async handleSuccessfulPayment(payload: TelegramStarsPayload): Promise<void> {
    this.logger.log(
      `Processing Telegram Stars payment: ${payload.telegramPaymentChargeId}`,
    );

    // Parse our custom invoice payload to get subscription ID
    let subscriptionId: string;
    try {
      const parsedPayload = JSON.parse(payload.invoicePayload);
      subscriptionId = parsedPayload.subscriptionId;

      if (!subscriptionId) {
        throw new Error('Missing subscriptionId in invoice payload');
      }
    } catch (error) {
      this.logger.error(
        'Failed to parse invoice payload',
        error instanceof Error ? error.message : String(error),
      );
      throw new BadRequestException('Invalid invoice payload');
    }

    // Find the subscription
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new BadRequestException(
        `Subscription ${subscriptionId} not found`,
      );
    }

    // Verify payment amount matches expected price
    const expectedStars = this.convertCentsToStars(subscription.plan.priceCents);
    const tolerance = 1; // Allow 1 star tolerance for rounding

    if (Math.abs(payload.totalAmount - expectedStars) > tolerance) {
      this.logger.error(
        `Payment amount mismatch for subscription ${subscriptionId}: ` +
        `expected ${expectedStars} stars, got ${payload.totalAmount} stars`,
      );
      throw new BadRequestException(
        `Payment amount mismatch: expected ${expectedStars} stars, received ${payload.totalAmount}`,
      );
    }

    const existingEvent = await this.prisma.paymentEvent.findUnique({
      where: {
        provider_externalId: {
          provider: PaymentProvider.TELEGRAM_STARS,
          externalId: payload.telegramPaymentChargeId,
        },
      },
    });

    if (existingEvent?.processedAt) {
      this.logger.warn(
        `Telegram Stars payment ${payload.telegramPaymentChargeId} already processed`,
      );
      return;
    }

    const eventPayload = {
      telegramUserId: payload.telegramUserId,
      totalAmount: payload.totalAmount,
      providerPaymentChargeId: payload.providerPaymentChargeId,
      processedAt: new Date().toISOString(),
    };

    const savedEvent =
      existingEvent ??
      (await this.prisma.paymentEvent.create({
        data: {
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id,
          provider: PaymentProvider.TELEGRAM_STARS,
          type: PaymentEventType.INVOICE_PAID,
          externalId: payload.telegramPaymentChargeId,
          payload: eventPayload,
          occurredAt: new Date(),
        },
      }));

    // Update subscription status
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        externalId: payload.telegramPaymentChargeId,
        startedAt: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(subscription.plan.interval),
      },
    });

    // Grant channel access - retry up to 3 times on failure
    let accessGranted = false;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.channelAccessService.handlePaymentSuccess(
          subscription.id,
          PaymentProvider.TELEGRAM_STARS,
        );
        accessGranted = true;
        break;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Attempt ${attempt}/3 failed to grant access for payment ${payload.telegramPaymentChargeId}: ${lastError.message}`,
        );
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!accessGranted) {
      this.logger.error(
        `Failed to grant access after 3 attempts for Telegram Stars payment ${payload.telegramPaymentChargeId}`,
        lastError,
      );
      // Don't throw - payment was successful, access grant is async via job queue
      // The job will be retried by BullMQ
    }

    await this.prisma.paymentEvent.update({
      where: { id: savedEvent.id },
      data: {
        subscriptionId: subscription.id,
        payload: eventPayload,
        processedAt: new Date(),
      },
    });

    this.logger.log(
      `Telegram Stars payment processed successfully for subscription ${subscriptionId}`,
    );
  }

  /**
   * Creates an invoice for Telegram Stars payment
   * Returns the invoice parameters that should be sent to Telegram
   */
  async createInvoice(
    planId: string,
    customer: TelegramStarsCustomerInput,
  ): Promise<TelegramStarsInvoice> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        product: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    if (!plan.isActive || plan.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Plan non disponible');
    }

    const telegramUserId = customer.telegramUserId.trim();

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        organizationId: plan.product.organizationId,
        telegramUserId,
      },
    });

    const customerRecord =
      existingCustomer ??
      (await this.prisma.customer.create({
        data: {
          organizationId: plan.product.organizationId,
          telegramUserId,
          telegramUsername: customer.telegramUsername?.toLowerCase(),
          displayName: customer.displayName,
        },
      }));

    if (existingCustomer) {
      const updateData: {
        telegramUsername?: string | null;
        displayName?: string | null;
      } = {};

      if (customer.telegramUsername && !existingCustomer.telegramUsername) {
        updateData.telegramUsername = customer.telegramUsername.toLowerCase();
      }
      if (customer.displayName && !existingCustomer.displayName) {
        updateData.displayName = customer.displayName;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.customer.update({
          where: { id: existingCustomer.id },
          data: updateData,
        });
      }
    }

    // Convert price from cents to Telegram Stars using configured rate
    const priceInStars = this.convertCentsToStars(plan.priceCents);

    // Create subscription in INCOMPLETE status
    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId: plan.product.organizationId,
        customerId: customerRecord.id,
        planId: plan.id,
        status: SubscriptionStatus.INCOMPLETE,
        metadata: {
          paymentMethod: 'telegram_stars',
          originalPriceCents: plan.priceCents,
          currency: plan.currency,
          starsAmount: priceInStars,
          conversionRate: this.starsConversionRate,
        },
      },
    });

    // Prepare invoice payload (this will be sent back to us on successful payment)
    const invoicePayload = JSON.stringify({
      subscriptionId: subscription.id,
      planId: plan.id,
      customerId: customerRecord.id,
      expectedStars: priceInStars,
    });

    return {
      subscriptionId: subscription.id,
      title: plan.name,
      description: plan.description || plan.product.description || 'Accès premium',
      payload: invoicePayload,
      currency: 'XTR', // Telegram Stars currency code
      prices: [
        {
          label: plan.name,
          amount: priceInStars,
        },
      ],
    };
  }

  /**
   * Validates a pre-checkout query before approving payment
   * Returns validation result with error message if invalid
   */
  async validatePreCheckout(invoicePayload: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const parsed = JSON.parse(invoicePayload);
      const { subscriptionId, expectedStars } = parsed;

      if (!subscriptionId) {
        return { valid: false, error: 'Missing subscriptionId in payload' };
      }

      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!subscription) {
        return { valid: false, error: 'Subscription not found' };
      }

      // Check subscription is still pending payment
      if (subscription.status !== SubscriptionStatus.INCOMPLETE) {
        return {
          valid: false,
          error: `Subscription already processed (status: ${subscription.status})`,
        };
      }

      // Check plan is still active
      if (!subscription.plan.isActive) {
        return { valid: false, error: 'Plan is no longer active' };
      }

      // Check product is still active
      if (subscription.plan.product.status !== ProductStatus.ACTIVE) {
        return { valid: false, error: 'Product is no longer available' };
      }

      // Verify expected amount matches current plan price
      const currentExpectedStars = this.convertCentsToStars(
        subscription.plan.priceCents,
      );
      if (expectedStars && expectedStars !== currentExpectedStars) {
        this.logger.warn(
          `Price changed since invoice creation for subscription ${subscriptionId}: ` +
          `invoice has ${expectedStars} stars, current price is ${currentExpectedStars} stars`,
        );
        // Allow payment to proceed - they'll pay the original quoted price
      }

      return { valid: true };
    } catch (error) {
      this.logger.error(
        'Failed to validate pre-checkout',
        error instanceof Error ? error.message : String(error),
      );
      return { valid: false, error: 'Invalid invoice payload' };
    }
  }

  private calculatePeriodEnd(interval: string): Date | null {
    const now = new Date();

    switch (interval) {
      case 'DAY':
        return new Date(now.setDate(now.getDate() + 1));
      case 'WEEK':
        return new Date(now.setDate(now.getDate() + 7));
      case 'MONTH':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'QUARTER':
        return new Date(now.setMonth(now.getMonth() + 3));
      case 'YEAR':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case 'ONE_TIME':
        return null;
      default:
        return null;
    }
  }
}
