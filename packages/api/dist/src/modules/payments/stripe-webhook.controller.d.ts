import { StripeWebhookService } from './stripe-webhook.service';
import type { StripeRawBodyRequest } from './stripe-webhook.service';
export declare class StripeWebhookController {
    private readonly stripeWebhookService;
    constructor(stripeWebhookService: StripeWebhookService);
    handleEvent(signature: string | undefined, request: StripeRawBodyRequest): Promise<{
        received: boolean;
    }>;
}
