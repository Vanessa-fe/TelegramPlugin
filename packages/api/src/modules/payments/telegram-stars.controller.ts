import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';
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
export class TelegramStarsController {
  constructor(
    private readonly telegramStarsService: TelegramStarsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Check if Telegram Stars payments are available for the organization
   * Requires Pro plan
   */
  @Get('availability')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  checkAvailability(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.telegramStarsService.checkAvailability(scopedOrgId);
  }

  @Post('invoice')
  @Public()
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
  @Public()
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
  @Public()
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
