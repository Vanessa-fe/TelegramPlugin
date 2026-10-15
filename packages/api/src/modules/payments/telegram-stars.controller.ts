import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { assertTelegramBotSecret, ZodValidationPipe } from '../../common';
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
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
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
    assertTelegramBotSecret(this.config, secret);
  }
}
