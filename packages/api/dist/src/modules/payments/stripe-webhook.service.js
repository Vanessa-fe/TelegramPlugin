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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeWebhookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const channel_access_service_1 = require("../channel-access/channel-access.service");
let StripeWebhookService = StripeWebhookService_1 = class StripeWebhookService {
    config;
    prisma;
    channelAccessService;
    logger = new common_1.Logger(StripeWebhookService_1.name);
    stripe;
    constructor(config, prisma, channelAccessService) {
        this.config = config;
        this.prisma = prisma;
        this.channelAccessService = channelAccessService;
        const apiKey = this.config.get('STRIPE_SECRET_KEY');
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        this.stripe = new stripe_1.default(apiKey, {
            apiVersion: '2024-06-20',
        });
    }
    async handleWebhook(signature, request) {
        const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new common_1.BadRequestException('Stripe webhook secret is not configured');
        }
        const rawBody = request.rawBody;
        if (!rawBody) {
            throw new common_1.BadRequestException('Missing raw body for Stripe signature verification');
        }
        let event;
        try {
            const bodyToVerify = typeof rawBody === 'string' ? rawBody : rawBody;
            event = this.stripe.webhooks.constructEvent(bodyToVerify, signature, webhookSecret);
        }
        catch (error) {
            this.logger.error('Stripe signature verification failed', error);
            throw new common_1.BadRequestException('Invalid Stripe signature');
        }
        await this.processEvent(event);
    }
    async processEvent(event) {
        const mappedType = this.mapEventType(event.type);
        if (!mappedType) {
            this.logger.debug(`Ignoring unsupported Stripe event type: ${event.type}`);
            return;
        }
        const context = await this.resolveContext(event);
        if (!context) {
            this.logger.warn(`Unable to resolve context for event ${event.id} (type ${event.type}), skipping processing`);
            return;
        }
        const occurredAt = new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000);
        const payload = JSON.parse(JSON.stringify(event));
        const existing = await this.prisma.paymentEvent.findUnique({
            where: {
                provider_externalId: {
                    provider: client_1.PaymentProvider.STRIPE,
                    externalId: event.id,
                },
            },
        });
        if (existing?.processedAt) {
            this.logger.debug(`Stripe event ${event.id} already processed, skipping domain side-effects`);
            return;
        }
        const savedEvent = existing ??
            (await this.prisma.paymentEvent.create({
                data: {
                    organizationId: context.organizationId,
                    subscriptionId: context.subscriptionId,
                    provider: client_1.PaymentProvider.STRIPE,
                    type: mappedType,
                    externalId: event.id,
                    payload,
                    occurredAt,
                },
            }));
        await this.applyDomainSideEffects(mappedType, context);
        await this.prisma.paymentEvent.update({
            where: { id: savedEvent.id },
            data: {
                subscriptionId: context.subscriptionId ?? savedEvent.subscriptionId,
                payload,
                occurredAt,
                processedAt: new Date(),
            },
        });
    }
    async resolveContext(event) {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;
                if (!subscriptionId) {
                    return this.contextFromMetadata(session.metadata ?? undefined);
                }
                return this.contextFromSubscription(subscriptionId);
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                return this.contextFromSubscription(subscription.id);
            }
            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
                if (!subscriptionId) {
                    return this.contextFromMetadata(invoice.metadata ?? undefined);
                }
                return this.contextFromSubscription(subscriptionId);
            }
            case 'charge.refunded': {
                const charge = event.data.object;
                const metadataContext = await this.contextFromMetadata(charge.metadata ?? undefined);
                if (metadataContext) {
                    return metadataContext;
                }
                const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : undefined;
                if (!invoiceId) {
                    return null;
                }
                try {
                    const invoice = await this.stripe.invoices.retrieve(invoiceId);
                    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
                    if (!subscriptionId) {
                        return null;
                    }
                    return this.contextFromSubscription(subscriptionId);
                }
                catch (error) {
                    this.logger.warn(`Failed to retrieve invoice ${invoiceId} for charge ${charge.id}: ${error.message}`);
                    return null;
                }
            }
            default:
                return null;
        }
    }
    async contextFromMetadata(metadata) {
        if (!metadata) {
            return null;
        }
        const organizationId = this.getMetadataString(metadata.organizationId ??
            metadata.organization_id ??
            metadata.orgId ??
            metadata.org_id);
        if (!organizationId) {
            return null;
        }
        const subscriptionId = this.getMetadataString(metadata.subscriptionId) ??
            this.getMetadataString(metadata.subscription_id) ??
            this.getMetadataString(metadata.subscription) ??
            this.getMetadataString(metadata.subscription_uuid);
        if (subscriptionId && this.isUuid(subscriptionId)) {
            return { organizationId, subscriptionId };
        }
        const stripeSubscriptionId = this.getMetadataString(metadata.stripeSubscriptionId) ??
            this.getMetadataString(metadata.stripe_subscription_id) ??
            this.getMetadataString(metadata.subscriptionExternalId) ??
            this.getMetadataString(metadata.subscription_external_id);
        if (stripeSubscriptionId && typeof stripeSubscriptionId === 'string') {
            return this.contextFromSubscription(stripeSubscriptionId);
        }
        return { organizationId };
    }
    async contextFromSubscription(stripeSubscriptionId) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { externalId: stripeSubscriptionId },
            select: { id: true, organizationId: true },
        });
        if (!subscription) {
            this.logger.warn(`No subscription found with Stripe external id ${stripeSubscriptionId}`);
            return null;
        }
        return {
            organizationId: subscription.organizationId,
            subscriptionId: subscription.id,
        };
    }
    isUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }
    getMetadataString(value) {
        if (typeof value !== 'string') {
            return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    mapEventType(eventType) {
        switch (eventType) {
            case 'checkout.session.completed':
                return client_1.PaymentEventType.CHECKOUT_COMPLETED;
            case 'customer.subscription.created':
                return client_1.PaymentEventType.SUBSCRIPTION_CREATED;
            case 'customer.subscription.updated':
                return client_1.PaymentEventType.SUBSCRIPTION_UPDATED;
            case 'customer.subscription.deleted':
                return client_1.PaymentEventType.SUBSCRIPTION_CANCELED;
            case 'invoice.payment_succeeded':
                return client_1.PaymentEventType.INVOICE_PAID;
            case 'invoice.payment_failed':
                return client_1.PaymentEventType.INVOICE_PAYMENT_FAILED;
            case 'charge.refunded':
                return client_1.PaymentEventType.REFUND_CREATED;
            default:
                return null;
        }
    }
    async applyDomainSideEffects(eventType, context) {
        if (!context.subscriptionId) {
            this.logger.debug(`Skipping domain side-effects for event type ${eventType} due to missing subscription context`);
            return;
        }
        const statusUpdate = this.subscriptionStatusForEvent(eventType);
        switch (eventType) {
            case client_1.PaymentEventType.CHECKOUT_COMPLETED:
            case client_1.PaymentEventType.SUBSCRIPTION_CREATED:
            case client_1.PaymentEventType.SUBSCRIPTION_UPDATED:
            case client_1.PaymentEventType.INVOICE_PAID:
                await this.channelAccessService.handlePaymentSuccess(context.subscriptionId, client_1.PaymentProvider.STRIPE);
                break;
            case client_1.PaymentEventType.SUBSCRIPTION_CANCELED:
                await this.channelAccessService.handlePaymentFailure(context.subscriptionId, 'canceled');
                break;
            case client_1.PaymentEventType.INVOICE_PAYMENT_FAILED:
                await this.channelAccessService.handlePaymentFailure(context.subscriptionId, 'payment_failed');
                break;
            case client_1.PaymentEventType.REFUND_CREATED:
                await this.channelAccessService.handlePaymentFailure(context.subscriptionId, 'refund');
                break;
            default:
                break;
        }
        if (statusUpdate) {
            await this.prisma.subscription.update({
                where: { id: context.subscriptionId },
                data: { status: statusUpdate },
            });
        }
    }
    subscriptionStatusForEvent(eventType) {
        switch (eventType) {
            case client_1.PaymentEventType.CHECKOUT_COMPLETED:
            case client_1.PaymentEventType.SUBSCRIPTION_CREATED:
            case client_1.PaymentEventType.SUBSCRIPTION_UPDATED:
            case client_1.PaymentEventType.INVOICE_PAID:
                return client_1.SubscriptionStatus.ACTIVE;
            case client_1.PaymentEventType.SUBSCRIPTION_CANCELED:
                return client_1.SubscriptionStatus.CANCELED;
            case client_1.PaymentEventType.INVOICE_PAYMENT_FAILED:
                return client_1.SubscriptionStatus.PAST_DUE;
            case client_1.PaymentEventType.REFUND_CREATED:
                return client_1.SubscriptionStatus.EXPIRED;
            default:
                return null;
        }
    }
};
exports.StripeWebhookService = StripeWebhookService;
exports.StripeWebhookService = StripeWebhookService = StripeWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        channel_access_service_1.ChannelAccessService])
], StripeWebhookService);
//# sourceMappingURL=stripe-webhook.service.js.map