import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from '../../common';
import { Public } from '../auth/decorators/public.decorator';
import {
  createTelegramStarsInvoiceSchema,
  telegramStarsWebhookSchema,
  validatePreCheckoutSchema,
  type CreateTelegramStarsInvoiceDto,
  type TelegramStarsWebhookDto,
  type ValidatePreCheckoutDto,
} from './telegram-stars.schema';
import { TelegramStarsService } from './telegram-stars.service';

@Controller('payments/telegram-stars')
@Public()
export class TelegramStarsController {
  constructor(
    private readonly telegramStarsService: TelegramStarsService,
    private readonly config: ConfigService,
  ) {}

  @Post('invoice')
  createInvoice(
    @Headers('x-telegram-stars-secret') secret: string | undefined,
    @Body(new ZodValidationPipe(createTelegramStarsInvoiceSchema))
    body: CreateTelegramStarsInvoiceDto,
  ) {
    this.ensureSecret(secret);

    return this.telegramStarsService.createInvoice(body.planId, {
      telegramUserId: body.customer.telegramUserId,
      telegramUsername: body.customer.telegramUsername,
      displayName: body.customer.displayName,
    });
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('x-telegram-stars-secret') secret: string | undefined,
    @Body(new ZodValidationPipe(telegramStarsWebhookSchema))
    body: TelegramStarsWebhookDto,
  ) {
    this.ensureSecret(secret);

    await this.telegramStarsService.handleSuccessfulPayment({
      telegramPaymentChargeId: body.telegramPaymentChargeId,
      telegramUserId: body.telegramUserId,
      totalAmount: body.totalAmount,
      invoicePayload: body.invoicePayload,
      providerPaymentChargeId: body.providerPaymentChargeId,
    });

    return { received: true };
  }

  @Post('validate-pre-checkout')
  async validatePreCheckout(
    @Headers('x-telegram-stars-secret') secret: string | undefined,
    @Body(new ZodValidationPipe(validatePreCheckoutSchema))
    body: ValidatePreCheckoutDto,
  ) {
    this.ensureSecret(secret);

    return this.telegramStarsService.validatePreCheckout(body.invoicePayload);
  }

  private ensureSecret(secret: string | undefined) {
    const expectedSecret = this.config.get<string>(
      'TELEGRAM_STARS_WEBHOOK_SECRET',
    );
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    // In production, secret is required
    if (isProduction && !expectedSecret) {
      throw new UnauthorizedException(
        'TELEGRAM_STARS_WEBHOOK_SECRET must be configured in production',
      );
    }

    // If secret is configured, it must match
    if (expectedSecret && secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid Telegram Stars secret');
    }

    // In development without secret configured, allow requests (with warning logged)
    if (!expectedSecret && !isProduction) {
      // Allow in dev mode without secret - but this is logged at startup
    }
  }
}
