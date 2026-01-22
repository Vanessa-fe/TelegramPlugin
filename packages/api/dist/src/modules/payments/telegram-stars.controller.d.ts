import { ConfigService } from '@nestjs/config';
import { type CreateTelegramStarsInvoiceDto, type TelegramStarsWebhookDto, type ValidatePreCheckoutDto } from './telegram-stars.schema';
import { TelegramStarsService } from './telegram-stars.service';
export declare class TelegramStarsController {
    private readonly telegramStarsService;
    private readonly config;
    constructor(telegramStarsService: TelegramStarsService, config: ConfigService);
    createInvoice(secret: string | undefined, body: CreateTelegramStarsInvoiceDto): Promise<import("./telegram-stars.service").TelegramStarsInvoice>;
    handleWebhook(secret: string | undefined, body: TelegramStarsWebhookDto): Promise<{
        received: boolean;
    }>;
    validatePreCheckout(secret: string | undefined, body: ValidatePreCheckoutDto): Promise<{
        valid: boolean;
        error?: string;
    }>;
    private ensureSecret;
}
