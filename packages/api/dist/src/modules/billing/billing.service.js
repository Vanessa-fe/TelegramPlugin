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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const prisma_service_1 = require("../../prisma/prisma.service");
let BillingService = class BillingService {
    config;
    prisma;
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
    async getStripeStatus(organizationId) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organisation introuvable');
        }
        if (!organization.stripeAccountId) {
            return {
                saasActive: organization.saasActive,
                connected: false,
            };
        }
        const account = await this.stripe.accounts.retrieve(organization.stripeAccountId);
        return {
            saasActive: organization.saasActive,
            connected: true,
            accountId: organization.stripeAccountId,
            chargesEnabled: account.charges_enabled ?? false,
            payoutsEnabled: account.payouts_enabled ?? false,
            detailsSubmitted: account.details_submitted ?? false,
        };
    }
    async createStripeConnectLink(organizationId) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organisation introuvable');
        }
        let accountId = organization.stripeAccountId;
        if (!accountId) {
            const account = await this.stripe.accounts.create({
                type: 'express',
                email: organization.billingEmail,
                metadata: {
                    organizationId: organization.id,
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });
            accountId = account.id;
            await this.prisma.organization.update({
                where: { id: organization.id },
                data: { stripeAccountId: accountId },
            });
        }
        const refreshUrl = this.config.get('STRIPE_CONNECT_REFRESH_URL');
        const returnUrl = this.config.get('STRIPE_CONNECT_RETURN_URL');
        if (!refreshUrl || !returnUrl) {
            throw new common_1.BadRequestException('Stripe Connect URLs are not configured');
        }
        const link = await this.stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
        return { url: link.url };
    }
    async createStripeLoginLink(organizationId) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organisation introuvable');
        }
        if (!organization.stripeAccountId) {
            throw new common_1.BadRequestException('Compte Stripe non connecté');
        }
        const stripeAccount = await this.stripe.accounts.retrieve(organization.stripeAccountId);
        if (!stripeAccount.charges_enabled) {
            throw new common_1.ForbiddenException("Compte Stripe incomplet, finalisez l'onboarding");
        }
        const link = await this.stripe.accounts.createLoginLink(organization.stripeAccountId);
        return { url: link.url };
    }
    async createCheckoutSession(payload) {
        const plan = await this.prisma.plan.findUnique({
            where: { id: payload.planId },
            include: {
                product: {
                    include: {
                        organization: true,
                    },
                },
            },
        });
        if (!plan || !plan.product?.organization) {
            throw new common_1.NotFoundException('Plan introuvable');
        }
        if (!plan.isActive || plan.product.status !== client_1.ProductStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Plan non disponible');
        }
        const organization = plan.product.organization;
        if (!organization.saasActive) {
            throw new common_1.ForbiddenException('Abonnement SaaS inactif');
        }
        if (!organization.stripeAccountId) {
            throw new common_1.BadRequestException('Compte Stripe non connecté');
        }
        const stripeAccount = await this.stripe.accounts.retrieve(organization.stripeAccountId);
        if (!stripeAccount.charges_enabled) {
            throw new common_1.ForbiddenException("Compte Stripe incomplet, finalisez l'onboarding");
        }
        const { customer } = payload;
        const email = customer.email?.toLowerCase();
        const telegramUserId = customer.telegramUserId?.trim();
        const telegramUsername = customer.telegramUsername?.toLowerCase();
        const customerFilters = [];
        if (email) {
            customerFilters.push({ email });
        }
        if (telegramUserId) {
            customerFilters.push({ telegramUserId });
        }
        if (customerFilters.length === 0) {
            throw new common_1.BadRequestException('Client non identifié');
        }
        const customerMatch = await this.prisma.customer.findFirst({
            where: {
                organizationId: organization.id,
                OR: customerFilters,
            },
        });
        const storedCustomer = customerMatch ??
            (await this.prisma.customer.create({
                data: {
                    organizationId: organization.id,
                    email,
                    displayName: customer.displayName,
                    telegramUserId,
                    telegramUsername,
                },
            }));
        if (customerMatch) {
            const updateData = {};
            if (email && !customerMatch.email) {
                updateData.email = email;
            }
            if (customer.displayName && !customerMatch.displayName) {
                updateData.displayName = customer.displayName;
            }
            if (telegramUserId && !customerMatch.telegramUserId) {
                updateData.telegramUserId = telegramUserId;
            }
            if (telegramUsername && !customerMatch.telegramUsername) {
                updateData.telegramUsername = telegramUsername;
            }
            if (Object.keys(updateData).length > 0) {
                await this.prisma.customer.update({
                    where: { id: customerMatch.id },
                    data: updateData,
                });
            }
        }
        const subscription = await this.prisma.subscription.create({
            data: {
                organizationId: organization.id,
                customerId: storedCustomer.id,
                planId: plan.id,
                status: client_1.SubscriptionStatus.INCOMPLETE,
                metadata: {
                    checkoutMode: plan.interval === client_1.PlanInterval.ONE_TIME
                        ? 'payment'
                        : 'subscription',
                },
            },
        });
        const quantity = payload.quantity ?? 1;
        const lineItem = {
            quantity,
            price_data: {
                currency: plan.currency.toLowerCase(),
                product_data: {
                    name: plan.name,
                    description: plan.description ?? plan.product.description ?? undefined,
                    metadata: {
                        organizationId: organization.id,
                        planId: plan.id,
                    },
                },
                unit_amount: plan.priceCents,
                ...(plan.interval !== client_1.PlanInterval.ONE_TIME && {
                    recurring: this.mapRecurring(plan.interval),
                }),
            },
        };
        const successUrl = this.config.get('STRIPE_CHECKOUT_SUCCESS_URL');
        const cancelUrl = this.config.get('STRIPE_CHECKOUT_CANCEL_URL');
        if (!successUrl || !cancelUrl) {
            throw new common_1.BadRequestException('Stripe checkout URLs are not configured');
        }
        const metadata = {
            organizationId: organization.id,
            subscriptionId: subscription.id,
            planId: plan.id,
            customerId: storedCustomer.id,
        };
        const sessionParams = {
            mode: plan.interval === client_1.PlanInterval.ONE_TIME ? 'payment' : 'subscription',
            line_items: [lineItem],
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            client_reference_id: subscription.id,
            customer_email: email,
            metadata,
        };
        if (plan.interval === client_1.PlanInterval.ONE_TIME) {
            const paymentIntentData = {
                metadata,
            };
            sessionParams.payment_intent_data = paymentIntentData;
        }
        else {
            const subscriptionData = {
                metadata,
            };
            if (plan.trialPeriodDays) {
                subscriptionData.trial_period_days = plan.trialPeriodDays;
            }
            sessionParams.subscription_data = subscriptionData;
        }
        let session;
        try {
            session = await this.stripe.checkout.sessions.create(sessionParams, {
                stripeAccount: organization.stripeAccountId,
            });
        }
        catch (error) {
            await this.prisma.subscription.delete({
                where: { id: subscription.id },
            });
            throw error;
        }
        if (!session.url) {
            throw new common_1.BadRequestException('Stripe checkout session invalide');
        }
        return { url: session.url, subscriptionId: subscription.id };
    }
    mapRecurring(interval) {
        switch (interval) {
            case client_1.PlanInterval.DAY:
                return { interval: 'day' };
            case client_1.PlanInterval.WEEK:
                return { interval: 'week' };
            case client_1.PlanInterval.MONTH:
                return { interval: 'month' };
            case client_1.PlanInterval.QUARTER:
                return { interval: 'month', interval_count: 3 };
            case client_1.PlanInterval.YEAR:
                return { interval: 'year' };
            default:
                throw new common_1.BadRequestException('Intervalle de plan non supporté');
        }
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map