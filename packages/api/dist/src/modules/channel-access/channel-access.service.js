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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const channel_access_queue_1 = require("./channel-access.queue");
const notifications_service_1 = require("../notifications/notifications.service");
let ChannelAccessService = ChannelAccessService_1 = class ChannelAccessService {
    prisma;
    queue;
    notifications;
    logger = new common_1.Logger(ChannelAccessService_1.name);
    constructor(prisma, queue, notifications) {
        this.prisma = prisma;
        this.queue = queue;
        this.notifications = notifications;
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
                        ? new Date(Date.now() + subscription.plan.accessDurationDays * 24 * 60 * 60 * 1000)
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
        await this.prisma.$transaction(async (tx) => {
            await tx.channelAccess.updateMany({
                where: {
                    subscriptionId,
                    status: {
                        in: [client_1.$Enums.AccessStatus.PENDING, client_1.$Enums.AccessStatus.GRANTED],
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
        });
        try {
            await this.queue.enqueueRevokeAccess({ subscriptionId, reason });
        }
        catch (error) {
            this.logger.error(`Failed to enqueue revoke access job for subscription ${subscriptionId}`, error);
        }
        try {
            const reasonMessages = {
                payment_failed: 'Échec du paiement',
                canceled: 'Abonnement annulé',
                refund: 'Remboursement effectué',
                expired: 'Abonnement expiré',
            };
            if (reason === 'payment_failed') {
                await this.notifications.sendPaymentFailed(subscription.customerId, subscription.id, reasonMessages[reason]);
            }
            else if ((reason === 'canceled' || reason === 'expired') && subscription.plan) {
                await this.notifications.sendSubscriptionCanceled(subscription.customerId, subscription.plan.name);
            }
            for (const access of subscription.channelAccesses) {
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
        notifications_service_1.NotificationsService])
], ChannelAccessService);
//# sourceMappingURL=channel-access.service.js.map