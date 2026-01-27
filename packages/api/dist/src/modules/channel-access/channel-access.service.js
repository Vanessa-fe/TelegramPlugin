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
var ChannelAccessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelAccessService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const channel_access_queue_1 = require("./channel-access.queue");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const DEFAULT_GRACE_PERIOD_DAYS = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
let ChannelAccessService = ChannelAccessService_1 = class ChannelAccessService {
    prisma;
    queue;
    notifications;
    config;
    auditLogService;
    logger = new common_1.Logger(ChannelAccessService_1.name);
    constructor(prisma, queue, notifications, config, auditLogService) {
        this.prisma = prisma;
        this.queue = queue;
        this.notifications = notifications;
        this.config = config;
        this.auditLogService = auditLogService;
    }
    getGracePeriodDays() {
        const rawValue = this.config.get('PAYMENT_GRACE_PERIOD_DAYS');
        if (!rawValue) {
            return DEFAULT_GRACE_PERIOD_DAYS;
        }
        const parsed = Number.parseInt(rawValue, 10);
        if (Number.isNaN(parsed) || parsed <= 0) {
            return DEFAULT_GRACE_PERIOD_DAYS;
        }
        return parsed;
    }
    async handlePaymentSuccess(subscriptionId, provider) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                customer: true,
                plan: {
                    include: {
                        product: {
                            include: {
                                channels: {
                                    include: {
                                        channel: true,
                                    },
                                },
                            },
                        },
                    },
                },
                channelAccesses: true,
            },
        });
        if (!subscription) {
            this.logger.warn(`Cannot grant channel access: subscription ${subscriptionId} not found`);
            return;
        }
        if (!subscription.plan?.product) {
            this.logger.warn(`Cannot grant channel access: plan/product not resolved for subscription ${subscriptionId}`);
            return;
        }
        const productChannels = subscription.plan.product.channels ?? [];
        if (productChannels.length === 0) {
            this.logger.debug(`No channels linked to plan ${subscription.planId}, nothing to grant`);
            return;
        }
        const existingAccessByChannel = new Map(subscription.channelAccesses.map((access) => [access.channelId, access]));
        const jobs = [];
        await this.prisma.$transaction(async (tx) => {
            for (const link of productChannels) {
                const channelId = link.channelId;
                const currentAccess = existingAccessByChannel.get(channelId);
                if (currentAccess?.status === client_1.$Enums.AccessStatus.GRANTED) {
                    this.logger.debug(`Channel ${channelId} already granted for subscription ${subscriptionId}, skipping`);
                    continue;
                }
                if (currentAccess?.status === client_1.$Enums.AccessStatus.REVOKE_PENDING) {
                    await tx.channelAccess.update({
                        where: { id: currentAccess.id },
                        data: {
                            status: client_1.$Enums.AccessStatus.GRANTED,
                            revokedAt: null,
                            revokeReason: null,
                        },
                    });
                    continue;
                }
                const payload = {
                    subscriptionId: subscription.id,
                    channelId,
                    customerId: subscription.customerId,
                    provider: provider.toLowerCase(),
                };
                jobs.push(payload);
                if (currentAccess) {
                    await tx.channelAccess.update({
                        where: { id: currentAccess.id },
                        data: {
                            status: client_1.$Enums.AccessStatus.PENDING,
                            grantedAt: null,
                            revokedAt: null,
                            revokeReason: null,
                            inviteId: null,
                        },
                    });
                    continue;
                }
                await tx.channelAccess.create({
                    data: {
                        subscriptionId: subscription.id,
                        channelId,
                        customerId: subscription.customerId,
                        status: client_1.$Enums.AccessStatus.PENDING,
                    },
                });
                const entitlementKey = `channel_access_${channelId}`;
                const existingEntitlement = await tx.entitlement.findFirst({
                    where: {
                        subscriptionId: subscription.id,
                        entitlementKey,
                    },
                });
                if (!existingEntitlement) {
                    const expiresAt = subscription.plan.accessDurationDays
                        ? new Date(Date.now() +
                            subscription.plan.accessDurationDays * 24 * 60 * 60 * 1000)
                        : null;
                    await tx.entitlement.create({
                        data: {
                            subscriptionId: subscription.id,
                            customerId: subscription.customerId,
                            entitlementKey,
                            type: client_1.EntitlementType.CHANNEL_ACCESS,
                            resourceId: channelId,
                            expiresAt,
                        },
                    });
                }
            }
        });
        for (const payload of jobs) {
            try {
                await this.queue.enqueueGrantAccess(payload);
            }
            catch (error) {
                this.logger.error(`Failed to enqueue grant access job for subscription ${payload.subscriptionId} and channel ${payload.channelId}`, error);
            }
        }
        try {
            await this.auditLogService.create({
                organizationId: subscription.organizationId,
                actorType: client_1.AuditActorType.SYSTEM,
                action: 'access.grant',
                resourceType: 'subscription',
                resourceId: subscription.id,
                metadata: {
                    provider,
                    channels: productChannels.length,
                    jobs: jobs.length,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to write audit log for access grant on subscription ${subscriptionId}`, error);
        }
        try {
            await this.notifications.sendPaymentConfirmation(subscription.customerId, subscription.id, subscription.plan.priceCents, subscription.plan.currency, subscription.plan.name);
        }
        catch (error) {
            this.logger.error(`Failed to send payment confirmation notification for subscription ${subscriptionId}`, error);
        }
    }
    async handlePaymentFailure(subscriptionId, reason) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                customer: true,
                plan: true,
                channelAccesses: {
                    include: { channel: true },
                },
            },
        });
        if (!subscription) {
            this.logger.warn(`Cannot revoke channel access: subscription ${subscriptionId} not found`);
            return;
        }
        const now = new Date();
        const activeAccesses = subscription.channelAccesses.filter((access) => access.status === client_1.$Enums.AccessStatus.PENDING ||
            access.status === client_1.$Enums.AccessStatus.GRANTED ||
            access.status === client_1.$Enums.AccessStatus.REVOKE_PENDING);
        const shouldNotifyPaymentFailed = reason === 'payment_failed' && !subscription.lastPaymentFailedAt;
        if (reason === 'payment_failed') {
            const gracePeriodDays = this.getGracePeriodDays();
            const gracePeriodMs = gracePeriodDays * DAY_IN_MS;
            const graceUntil = subscription.graceUntil && subscription.graceUntil > now
                ? subscription.graceUntil
                : new Date(now.getTime() + gracePeriodMs);
            const graceExpired = subscription.graceUntil
                ? subscription.graceUntil <= now
                : false;
            if (!graceExpired) {
                await this.prisma.$transaction(async (tx) => {
                    await tx.channelAccess.updateMany({
                        where: {
                            subscriptionId,
                            status: {
                                in: [client_1.$Enums.AccessStatus.PENDING, client_1.$Enums.AccessStatus.GRANTED],
                            },
                        },
                        data: {
                            status: client_1.$Enums.AccessStatus.REVOKE_PENDING,
                            revokedAt: null,
                            revokeReason: null,
                        },
                    });
                    await tx.subscription.update({
                        where: { id: subscriptionId },
                        data: {
                            graceUntil,
                            lastPaymentFailedAt: now,
                        },
                    });
                });
                try {
                    if (shouldNotifyPaymentFailed) {
                        await this.notifications.sendPaymentFailed(subscription.customerId, subscription.id, 'Échec du paiement');
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to send payment failed notification for subscription ${subscriptionId}`, error);
                }
                return;
            }
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.channelAccess.updateMany({
                where: {
                    subscriptionId,
                    status: {
                        in: [
                            client_1.$Enums.AccessStatus.PENDING,
                            client_1.$Enums.AccessStatus.GRANTED,
                            client_1.$Enums.AccessStatus.REVOKE_PENDING,
                        ],
                    },
                },
                data: {
                    status: client_1.$Enums.AccessStatus.REVOKED,
                    revokedAt: now,
                    revokeReason: reason,
                },
            });
            await tx.entitlement.updateMany({
                where: {
                    subscriptionId,
                    revokedAt: null,
                },
                data: {
                    revokedAt: now,
                    revokeReason: reason,
                },
            });
            await tx.subscription.update({
                where: { id: subscriptionId },
                data: {
                    graceUntil: null,
                },
            });
        });
        try {
            await this.queue.enqueueRevokeAccess({ subscriptionId, reason });
        }
        catch (error) {
            this.logger.error(`Failed to enqueue revoke access job for subscription ${subscriptionId}`, error);
        }
        try {
            await this.auditLogService.create({
                organizationId: subscription.organizationId,
                actorType: client_1.AuditActorType.SYSTEM,
                action: 'access.revoke',
                resourceType: 'subscription',
                resourceId: subscription.id,
                metadata: { reason },
            });
        }
        catch (error) {
            this.logger.error(`Failed to write audit log for access revoke on subscription ${subscriptionId}`, error);
        }
        try {
            const reasonMessages = {
                payment_failed: 'Échec du paiement',
                canceled: 'Abonnement annulé',
                refund: 'Remboursement effectué',
                expired: 'Abonnement expiré',
            };
            if (shouldNotifyPaymentFailed) {
                await this.notifications.sendPaymentFailed(subscription.customerId, subscription.id, reasonMessages[reason]);
            }
            else if ((reason === 'canceled' || reason === 'expired') &&
                subscription.plan) {
                await this.notifications.sendSubscriptionCanceled(subscription.customerId, subscription.plan.name);
            }
            for (const access of activeAccesses) {
                if (access.channel && access.channel.title) {
                    await this.notifications.sendAccessRevoked(subscription.customerId, access.channel.title, reasonMessages[reason]);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to send revocation notification for subscription ${subscriptionId}`, error);
        }
    }
};
exports.ChannelAccessService = ChannelAccessService;
exports.ChannelAccessService = ChannelAccessService = ChannelAccessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        channel_access_queue_1.ChannelAccessQueue,
        notifications_service_1.NotificationsService,
        config_1.ConfigService,
        audit_log_service_1.AuditLogService])
], ChannelAccessService);
//# sourceMappingURL=channel-access.service.js.map