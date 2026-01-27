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
var PlatformSubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const prisma_service_1 = require("../../prisma/prisma.service");
let PlatformSubscriptionService = PlatformSubscriptionService_1 = class PlatformSubscriptionService {
    config;
    prisma;
    logger = new common_1.Logger(PlatformSubscriptionService_1.name);
    stripe;
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        const apiKey = this.config.get('STRIPE_SECRET_KEY');
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        this.stripe = new stripe_1.default(apiKey, {
            apiVersion: '2024-06-20',
        });
    }
    async getPlans() {
        const plans = await this.prisma.platformPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        return plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            displayName: plan.displayName,
            priceCents: plan.priceCents,
            currency: plan.currency,
            interval: plan.interval,
            trialPeriodDays: plan.trialPeriodDays,
            features: plan.features,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
        }));
    }
    async getSubscription(organizationId) {
        const subscription = await this.prisma.platformSubscription.findUnique({
            where: { organizationId },
            include: { platformPlan: true },
        });
        if (!subscription) {
            return null;
        }
        const metadata = subscription.metadata;
        return {
            id: subscription.id,
            organizationId: subscription.organizationId,
            status: subscription.status,
            plan: subscription.platformPlan
                ? {
                    id: subscription.platformPlan.id,
                    name: subscription.platformPlan.name,
                    displayName: subscription.platformPlan.displayName,
                    priceCents: subscription.platformPlan.priceCents,
                    currency: subscription.platformPlan.currency,
                    interval: subscription.platformPlan.interval,
                    trialPeriodDays: subscription.platformPlan.trialPeriodDays,
                    features: subscription.platformPlan.features,
                    isActive: subscription.platformPlan.isActive,
                    sortOrder: subscription.platformPlan.sortOrder,
                }
                : null,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEndsAt: subscription.trialEndsAt,
            canceledAt: subscription.canceledAt,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            graceUntil: subscription.graceUntil,
            isGrandfathered: metadata?.grandfathered === true,
            createdAt: subscription.createdAt,
        };
    }
    async createCheckoutSession(organizationId, planName) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            include: { platformSubscription: true },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organisation introuvable');
        }
        if (organization.platformSubscription) {
            const status = organization.platformSubscription.status;
            if (status === client_1.PlatformSubscriptionStatus.ACTIVE ||
                status === client_1.PlatformSubscriptionStatus.TRIALING) {
                throw new common_1.ForbiddenException('Un abonnement plateforme est déjà actif');
            }
        }
        const plan = await this.prisma.platformPlan.findUnique({
            where: { name: planName },
        });
        if (!plan || !plan.isActive) {
            throw new common_1.NotFoundException('Plan introuvable ou inactif');
        }
        let stripeCustomerId = organization.platformSubscription?.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await this.stripe.customers.create({
                email: organization.billingEmail,
                metadata: {
                    organizationId: organization.id,
                    type: 'platform',
                },
            });
            stripeCustomerId = customer.id;
        }
        let stripePriceId = plan.stripePriceId;
        if (!stripePriceId) {
            const price = await this.stripe.prices.create({
                currency: plan.currency.toLowerCase(),
                unit_amount: plan.priceCents,
                recurring: {
                    interval: 'month',
                },
                product_data: {
                    name: `Solynk ${plan.displayName}`,
                    metadata: {
                        platformPlanId: plan.id,
                        type: 'platform',
                    },
                },
                metadata: {
                    platformPlanId: plan.id,
                    type: 'platform',
                },
            });
            stripePriceId = price.id;
            await this.prisma.platformPlan.update({
                where: { id: plan.id },
                data: { stripePriceId },
            });
        }
        const successUrl = this.config.get('PLATFORM_CHECKOUT_SUCCESS_URL');
        const cancelUrl = this.config.get('PLATFORM_CHECKOUT_CANCEL_URL');
        if (!successUrl || !cancelUrl) {
            throw new common_1.BadRequestException('Platform checkout URLs are not configured');
        }
        const trialPeriodDays = plan.trialPeriodDays ??
            this.config.get('PLATFORM_TRIAL_DAYS') ??
            14;
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                organizationId: organization.id,
                platformPlanId: plan.id,
                type: 'platform',
            },
            subscription_data: {
                trial_period_days: trialPeriodDays,
                metadata: {
                    organizationId: organization.id,
                    platformPlanId: plan.id,
                    type: 'platform',
                },
            },
        });
        await this.prisma.platformSubscription.upsert({
            where: { organizationId: organization.id },
            create: {
                organizationId: organization.id,
                platformPlanId: plan.id,
                status: client_1.PlatformSubscriptionStatus.INCOMPLETE,
                stripeCustomerId,
                metadata: {
                    checkoutSessionId: session.id,
                },
            },
            update: {
                platformPlanId: plan.id,
                status: client_1.PlatformSubscriptionStatus.INCOMPLETE,
                stripeCustomerId,
                metadata: {
                    checkoutSessionId: session.id,
                },
            },
        });
        if (!session.url) {
            throw new common_1.BadRequestException('Stripe checkout session invalide');
        }
        return { url: session.url };
    }
    async createPortalSession(organizationId) {
        const subscription = await this.prisma.platformSubscription.findUnique({
            where: { organizationId },
        });
        if (!subscription || !subscription.stripeCustomerId) {
            throw new common_1.NotFoundException('Aucun abonnement plateforme trouvé');
        }
        const metadata = subscription.metadata;
        if (metadata?.grandfathered === true) {
            throw new common_1.ForbiddenException('Les comptes grandfathered ne peuvent pas accéder au portail');
        }
        const returnUrl = this.config.get('PLATFORM_CHECKOUT_SUCCESS_URL') ??
            this.config.get('FRONTEND_URL');
        if (!returnUrl) {
            throw new common_1.BadRequestException('Return URL not configured');
        }
        const portalSession = await this.stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: returnUrl,
        });
        return { url: portalSession.url };
    }
    async cancelSubscription(organizationId) {
        const subscription = await this.prisma.platformSubscription.findUnique({
            where: { organizationId },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Aucun abonnement plateforme trouvé');
        }
        const metadata = subscription.metadata;
        if (metadata?.grandfathered === true) {
            throw new common_1.ForbiddenException('Les comptes grandfathered ne peuvent pas être annulés');
        }
        if (!subscription.stripeSubscriptionId) {
            throw new common_1.BadRequestException("L'abonnement n'est pas lié à Stripe");
        }
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        await this.prisma.platformSubscription.update({
            where: { id: subscription.id },
            data: {
                cancelAtPeriodEnd: true,
                canceledAt: new Date(),
            },
        });
        this.logger.log(`Platform subscription ${subscription.id} scheduled for cancellation`);
    }
    async handleWebhookEvent(event) {
        this.logger.debug(`Processing platform webhook event: ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await this.handleInvoicePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                this.logger.debug(`Ignoring unhandled platform event type: ${event.type}`);
        }
    }
    async handleCheckoutCompleted(session) {
        const organizationId = session.metadata?.organizationId;
        const platformPlanId = session.metadata?.platformPlanId;
        if (!organizationId || !platformPlanId) {
            this.logger.warn('Checkout session missing required metadata');
            return;
        }
        const stripeSubscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;
        if (!stripeSubscriptionId) {
            this.logger.warn('Checkout session missing subscription ID');
            return;
        }
        const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
        await this.prisma.platformSubscription.update({
            where: { organizationId },
            data: {
                stripeSubscriptionId,
                status: this.mapStripeStatus(stripeSubscription.status),
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                trialEndsAt: stripeSubscription.trial_end
                    ? new Date(stripeSubscription.trial_end * 1000)
                    : null,
            },
        });
        await this.updateSaasActive(organizationId);
        this.logger.log(`Platform subscription activated for organization ${organizationId}`);
    }
    async handleSubscriptionUpdated(subscription) {
        const organizationId = subscription.metadata?.organizationId;
        if (!organizationId) {
            const platformSub = await this.prisma.platformSubscription.findUnique({
                where: { stripeSubscriptionId: subscription.id },
            });
            if (!platformSub) {
                this.logger.debug(`No platform subscription found for Stripe subscription ${subscription.id}`);
                return;
            }
            await this.updateSubscriptionFromStripe(platformSub.organizationId, subscription);
            return;
        }
        await this.updateSubscriptionFromStripe(organizationId, subscription);
    }
    async handleSubscriptionDeleted(subscription) {
        const platformSub = await this.prisma.platformSubscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
        });
        if (!platformSub) {
            this.logger.debug(`No platform subscription found for deleted Stripe subscription ${subscription.id}`);
            return;
        }
        const gracePeriodDays = this.config.get('PLATFORM_GRACE_PERIOD_DAYS') ?? 7;
        const graceUntil = new Date();
        graceUntil.setDate(graceUntil.getDate() + gracePeriodDays);
        await this.prisma.platformSubscription.update({
            where: { id: platformSub.id },
            data: {
                status: client_1.PlatformSubscriptionStatus.CANCELED,
                canceledAt: new Date(),
                graceUntil,
            },
        });
        await this.updateSaasActive(platformSub.organizationId);
        this.logger.log(`Platform subscription ${platformSub.id} canceled with grace until ${graceUntil.toISOString()}`);
    }
    async handleInvoicePaymentSucceeded(invoice) {
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subscriptionId) {
            return;
        }
        const platformSub = await this.prisma.platformSubscription.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
        });
        if (!platformSub) {
            return;
        }
        if (platformSub.status === client_1.PlatformSubscriptionStatus.PAST_DUE) {
            await this.prisma.platformSubscription.update({
                where: { id: platformSub.id },
                data: {
                    status: client_1.PlatformSubscriptionStatus.ACTIVE,
                    graceUntil: null,
                },
            });
            await this.updateSaasActive(platformSub.organizationId);
        }
    }
    async handleInvoicePaymentFailed(invoice) {
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subscriptionId) {
            return;
        }
        const platformSub = await this.prisma.platformSubscription.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
        });
        if (!platformSub) {
            return;
        }
        const gracePeriodDays = this.config.get('PLATFORM_GRACE_PERIOD_DAYS') ?? 7;
        const graceUntil = new Date();
        graceUntil.setDate(graceUntil.getDate() + gracePeriodDays);
        await this.prisma.platformSubscription.update({
            where: { id: platformSub.id },
            data: {
                status: client_1.PlatformSubscriptionStatus.PAST_DUE,
                graceUntil,
            },
        });
        this.logger.warn(`Platform subscription ${platformSub.id} payment failed, grace until ${graceUntil.toISOString()}`);
    }
    async updateSubscriptionFromStripe(organizationId, subscription) {
        await this.prisma.platformSubscription.update({
            where: { organizationId },
            data: {
                status: this.mapStripeStatus(subscription.status),
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                trialEndsAt: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000)
                    : null,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at
                    ? new Date(subscription.canceled_at * 1000)
                    : null,
            },
        });
        await this.updateSaasActive(organizationId);
    }
    async updateSaasActive(organizationId) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            include: { platformSubscription: true },
        });
        if (!organization) {
            return;
        }
        const sub = organization.platformSubscription;
        const isPlatformActive = Boolean(sub &&
            (sub.status === client_1.PlatformSubscriptionStatus.ACTIVE ||
                sub.status === client_1.PlatformSubscriptionStatus.TRIALING ||
                (sub.graceUntil && sub.graceUntil > new Date())));
        const metadata = sub?.metadata;
        const isGrandfathered = metadata?.grandfathered === true;
        let isConnectReady = false;
        if (organization.stripeAccountId) {
            try {
                const account = await this.stripe.accounts.retrieve(organization.stripeAccountId);
                isConnectReady = Boolean(account.charges_enabled && account.details_submitted);
            }
            catch (error) {
                this.logger.warn(`Failed to retrieve Stripe account for org ${organizationId}`, error);
            }
        }
        const newSaasActive = Boolean(isGrandfathered || (isPlatformActive && isConnectReady));
        if (organization.saasActive !== newSaasActive) {
            await this.prisma.organization.update({
                where: { id: organizationId },
                data: { saasActive: newSaasActive },
            });
            this.logger.log(`Organization ${organizationId} saasActive updated to ${newSaasActive} ` +
                `(platformActive: ${isPlatformActive}, connectReady: ${isConnectReady}, grandfathered: ${isGrandfathered})`);
        }
    }
    mapStripeStatus(status) {
        switch (status) {
            case 'trialing':
                return client_1.PlatformSubscriptionStatus.TRIALING;
            case 'active':
                return client_1.PlatformSubscriptionStatus.ACTIVE;
            case 'past_due':
                return client_1.PlatformSubscriptionStatus.PAST_DUE;
            case 'canceled':
                return client_1.PlatformSubscriptionStatus.CANCELED;
            case 'incomplete':
            case 'incomplete_expired':
                return client_1.PlatformSubscriptionStatus.INCOMPLETE;
            case 'unpaid':
            case 'paused':
            default:
                return client_1.PlatformSubscriptionStatus.EXPIRED;
        }
    }
};
exports.PlatformSubscriptionService = PlatformSubscriptionService;
exports.PlatformSubscriptionService = PlatformSubscriptionService = PlatformSubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], PlatformSubscriptionService);
//# sourceMappingURL=platform-subscription.service.js.map