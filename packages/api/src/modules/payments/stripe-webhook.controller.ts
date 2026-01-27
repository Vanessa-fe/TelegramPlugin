import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { StripeWebhookService } from './stripe-webhook.service';
import type { StripeRawBodyRequest } from './stripe-webhook.service';

@Controller('webhooks/stripe')
@Public()
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post()
  async handleEvent(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() request: StripeRawBodyRequest,
  ) {
    if (!signature) {
      throw new BadRequestException('Stripe signature header missing');
    }

    await this.stripeWebhookService.handleWebhook(signature, request);

    return { received: true };
  }
}
