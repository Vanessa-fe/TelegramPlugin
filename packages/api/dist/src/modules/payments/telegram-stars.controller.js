"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramStarsController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const common_2 = require("../../common");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const telegram_stars_schema_1 = require("./telegram-stars.schema");
const telegram_stars_service_1 = require("./telegram-stars.service");
let TelegramStarsController = class TelegramStarsController {
    telegramStarsService;
    config;
    constructor(telegramStarsService, config) {
        this.telegramStarsService = telegramStarsService;
        this.config = config;
    }
    createInvoice(secret, body) {
        this.ensureSecret(secret);
        return this.telegramStarsService.createInvoice(body.planId, {
            telegramUserId: body.customer.telegramUserId,
            telegramUsername: body.customer.telegramUsername,
            displayName: body.customer.displayName,
        });
    }
    async handleWebhook(secret, body) {
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
    async validatePreCheckout(secret, body) {
        this.ensureSecret(secret);
        return this.telegramStarsService.validatePreCheckout(body.invoicePayload);
    }
    ensureSecret(secret) {
        const expectedSecret = this.config.get('TELEGRAM_STARS_WEBHOOK_SECRET');
        const isProduction = this.config.get('NODE_ENV') === 'production';
        if (isProduction && !expectedSecret) {
            throw new common_1.UnauthorizedException('TELEGRAM_STARS_WEBHOOK_SECRET must be configured in production');
        }
        if (expectedSecret && secret !== expectedSecret) {
            throw new common_1.UnauthorizedException('Invalid Telegram Stars secret');
        }
        if (!expectedSecret && !isProduction) {
        }
    }
};
exports.TelegramStarsController = TelegramStarsController;
__decorate([
    (0, common_1.Post)('invoice'),
    __param(0, (0, common_1.Headers)('x-telegram-stars-secret')),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(telegram_stars_schema_1.createTelegramStarsInvoiceSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TelegramStarsController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Headers)('x-telegram-stars-secret')),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(telegram_stars_schema_1.telegramStarsWebhookSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TelegramStarsController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)('validate-pre-checkout'),
    __param(0, (0, common_1.Headers)('x-telegram-stars-secret')),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(telegram_stars_schema_1.validatePreCheckoutSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TelegramStarsController.prototype, "validatePreCheckout", null);
exports.TelegramStarsController = TelegramStarsController = __decorate([
    (0, common_1.Controller)('payments/telegram-stars'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [telegram_stars_service_1.TelegramStarsService,
        config_1.ConfigService])
], TelegramStarsController);
//# sourceMappingURL=telegram-stars.controller.js.map