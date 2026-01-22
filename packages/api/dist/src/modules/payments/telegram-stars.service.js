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
var TelegramStarsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramStarsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const channel_access_service_1 = require("../channel-access/channel-access.service");
const DEFAULT_STARS_CONVERSION_RATE = 2;
let TelegramStarsService = TelegramStarsService_1 = class TelegramStarsService {
    prisma;
    channelAccessService;
    config;
    logger = new common_1.Logger(TelegramStarsService_1.name);
    starsConversionRate;
    constructor(prisma, channelAccessService, config) {
        this.prisma = prisma;
        this.channelAccessService = channelAccessService;
        this.config = config;
        this.starsConversionRate =
            this.config.get('TELEGRAM_STARS_CONVERSION_RATE') ??
                DEFAULT_STARS_CONVERSION_RATE;
    }
    convertCentsToStars(priceCents) {
        return Math.ceil(priceCents / this.starsConversionRate);
    }
    convertStarsToCents(stars) {
        return stars * this.starsConversionRate;
    }
    async handleSuccessfulPayment(payload) {
        this.logger.log(`Processing Telegram Stars payment: ${payload.telegramPaymentChargeId}`);
        let subscriptionId;
        try {
            const parsedPayload = JSON.parse(payload.invoicePayload);
            subscriptionId = parsedPayload.subscriptionId;
            if (!subscriptionId) {
                throw new Error('Missing subscriptionId in invoice payload');
            }
        }
        catch (error) {
            this.logger.error('Failed to parse invoice payload', error instanceof Error ? error.message : String(error));
            throw new common_1.BadRequestException('Invalid invoice payload');
        }
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                customer: true,
                plan: true,
            },
        });
        if (!subscription) {
            throw new common_1.BadRequestException(`Subscription ${subscriptionId} not found`);
        }
        const expectedStars = this.convertCentsToStars(subscription.plan.priceCents);
        const tolerance = 1;
        if (Math.abs(payload.totalAmount - expectedStars) > tolerance) {
            this.logger.error(`Payment amount mismatch for subscription ${subscriptionId}: ` +
                `expected ${expectedStars} stars, got ${payload.totalAmount} stars`);
            throw new common_1.BadRequestException(`Payment amount mismatch: expected ${expectedStars} stars, received ${payload.totalAmount}`);
        }
        const existingEvent = await this.prisma.paymentEvent.findUnique({
            where: {
                provider_externalId: {
                    provider: client_1.PaymentProvider.TELEGRAM_STARS,
                    externalId: payload.telegramPaymentChargeId,
                },
            },
        });
        if (existingEvent?.processedAt) {
            this.logger.warn(`Telegram Stars payment ${payload.telegramPaymentChargeId} already processed`);
            return;
        }
        const eventPayload = {
            telegramUserId: payload.telegramUserId,
            totalAmount: payload.totalAmount,
            providerPaymentChargeId: payload.providerPaymentChargeId,
            processedAt: new Date().toISOString(),
        };
        const savedEvent = existingEvent ??
            (await this.prisma.paymentEvent.create({
                data: {
                    organizationId: subscription.organizationId,
                    subscriptionId: subscription.id,
                    provider: client_1.PaymentProvider.TELEGRAM_STARS,
                    type: client_1.PaymentEventType.INVOICE_PAID,
                    externalId: payload.telegramPaymentChargeId,
                    payload: eventPayload,
                    occurredAt: new Date(),
                },
            }));
        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: client_1.SubscriptionStatus.ACTIVE,
                externalId: payload.telegramPaymentChargeId,
                startedAt: new Date(),
                currentPeriodStart: new Date(),
                currentPeriodEnd: this.calculatePeriodEnd(subscription.plan.interval),
            },
        });
        let accessGranted = false;
        let lastError = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await this.channelAccessService.handlePaymentSuccess(subscription.id, client_1.PaymentProvider.TELEGRAM_STARS);
                accessGranted = true;
                break;
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Attempt ${attempt}/3 failed to grant access for payment ${payload.telegramPaymentChargeId}: ${lastError.message}`);
                if (attempt < 3) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        if (!accessGranted) {
            this.logger.error(`Failed to grant access after 3 attempts for Telegram Stars payment ${payload.telegramPaymentChargeId}`, lastError);
        }
        await this.prisma.paymentEvent.update({
            where: { id: savedEvent.id },
            data: {
                subscriptionId: subscription.id,
                payload: eventPayload,
                processedAt: new Date(),
            },
        });
        this.logger.log(`Telegram Stars payment processed successfully for subscription ${subscriptionId}`);
    }
    async createInvoice(planId, customer) {
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
            throw new common_1.BadRequestException('Plan not found');
        }
        if (!plan.isActive || plan.product.status !== client_1.ProductStatus.ACTIVE) {
            throw new common_1.BadRequestException('Plan non disponible');
        }
        const telegramUserId = customer.telegramUserId.trim();
        const existingCustomer = await this.prisma.customer.findFirst({
            where: {
                organizationId: plan.product.organizationId,
                telegramUserId,
            },
        });
        const customerRecord = existingCustomer ??
            (await this.prisma.customer.create({
                data: {
                    organizationId: plan.product.organizationId,
                    telegramUserId,
                    telegramUsername: customer.telegramUsername?.toLowerCase(),
                    displayName: customer.displayName,
                },
            }));
        if (existingCustomer) {
            const updateData = {};
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
        const priceInStars = this.convertCentsToStars(plan.priceCents);
        const subscription = await this.prisma.subscription.create({
            data: {
                organizationId: plan.product.organizationId,
                customerId: customerRecord.id,
                planId: plan.id,
                status: client_1.SubscriptionStatus.INCOMPLETE,
                metadata: {
                    paymentMethod: 'telegram_stars',
                    originalPriceCents: plan.priceCents,
                    currency: plan.currency,
                    starsAmount: priceInStars,
                    conversionRate: this.starsConversionRate,
                },
            },
        });
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
            currency: 'XTR',
            prices: [
                {
                    label: plan.name,
                    amount: priceInStars,
                },
            ],
        };
    }
    async validatePreCheckout(invoicePayload) {
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
            if (subscription.status !== client_1.SubscriptionStatus.INCOMPLETE) {
                return {
                    valid: false,
                    error: `Subscription already processed (status: ${subscription.status})`,
                };
            }
            if (!subscription.plan.isActive) {
                return { valid: false, error: 'Plan is no longer active' };
            }
            if (subscription.plan.product.status !== client_1.ProductStatus.ACTIVE) {
                return { valid: false, error: 'Product is no longer available' };
            }
            const currentExpectedStars = this.convertCentsToStars(subscription.plan.priceCents);
            if (expectedStars && expectedStars !== currentExpectedStars) {
                this.logger.warn(`Price changed since invoice creation for subscription ${subscriptionId}: ` +
                    `invoice has ${expectedStars} stars, current price is ${currentExpectedStars} stars`);
            }
            return { valid: true };
        }
        catch (error) {
            this.logger.error('Failed to validate pre-checkout', error instanceof Error ? error.message : String(error));
            return { valid: false, error: 'Invalid invoice payload' };
        }
    }
    calculatePeriodEnd(interval) {
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
};
exports.TelegramStarsService = TelegramStarsService;
exports.TelegramStarsService = TelegramStarsService = TelegramStarsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        channel_access_service_1.ChannelAccessService,
        config_1.ConfigService])
], TelegramStarsService);
//# sourceMappingURL=telegram-stars.service.js.map