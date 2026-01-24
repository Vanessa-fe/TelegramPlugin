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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const channel_access_service_1 = require("../channel-access/channel-access.service");
const data_exports_service_1 = require("../data-exports/data-exports.service");
const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 400;
const DEFAULT_PAYMENT_EVENT_RETENTION_DAYS = 730;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
let SchedulerService = SchedulerService_1 = class SchedulerService {
    prisma;
    channelAccessService;
    config;
    dataExportsService;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(prisma, channelAccessService, config, dataExportsService) {
        this.prisma = prisma;
        this.channelAccessService = channelAccessService;
        this.config = config;
        this.dataExportsService = dataExportsService;
    }
    async handleExpiredEntitlements() {
        this.logger.log('Starting expired entitlements check...');
        const now = new Date();
        const expiredEntitlements = await this.prisma.entitlement.findMany({
            where: {
                expiresAt: {
                    lte: now,
                },
                revokedAt: null,
            },
            include: {
                subscription: {
                    include: {
                        customer: true,
                        plan: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
                customer: true,
            },
        });
        if (expiredEntitlements.length === 0) {
            this.logger.debug('No expired entitlements found');
            return;
        }
        this.logger.log(`Found ${expiredEntitlements.length} expired entitlements`);
        let revokedCount = 0;
        let errorCount = 0;
        for (const entitlement of expiredEntitlements) {
            try {
                await this.prisma.entitlement.update({
                    where: { id: entitlement.id },
                    data: {
                        revokedAt: now,
                        revokeReason: 'expired',
                    },
                });
                revokedCount++;
                this.logger.debug(`Revoked entitlement ${entitlement.id} for customer ${entitlement.customerId}`);
            }
            catch (error) {
                errorCount++;
                this.logger.error(`Failed to revoke entitlement ${entitlement.id}: ${error.message}`);
            }
        }
        this.logger.log(`Expired entitlements check complete: ${revokedCount} revoked, ${errorCount} errors`);
    }
    async handleExpiredGracePeriods() {
        this.logger.log('Starting grace period expiration check...');
        const now = new Date();
        const expiredGraceSubscriptions = await this.prisma.subscription.findMany({
            where: {
                graceUntil: {
                    lte: now,
                },
                status: client_1.SubscriptionStatus.PAST_DUE,
            },
            select: {
                id: true,
            },
        });
        if (expiredGraceSubscriptions.length === 0) {
            this.logger.debug('No expired grace periods found');
            return;
        }
        for (const subscription of expiredGraceSubscriptions) {
            try {
                await this.channelAccessService.handlePaymentFailure(subscription.id, 'payment_failed');
                this.logger.debug(`Revoked access after grace period for subscription ${subscription.id}`);
            }
            catch (error) {
                this.logger.error(`Failed to revoke access after grace period for subscription ${subscription.id}: ${error.message}`);
            }
        }
        this.logger.log('Grace period expiration check complete');
    }
    async handleExpiredChannelAccesses() {
        this.logger.log('Starting expired channel accesses check...');
        const now = new Date();
        const expiredAccesses = await this.prisma.channelAccess.findMany({
            where: {
                status: client_1.AccessStatus.GRANTED,
                subscription: {
                    OR: [
                        {
                            currentPeriodEnd: {
                                lte: now,
                            },
                            status: {
                                in: ['CANCELED', 'EXPIRED'],
                            },
                        },
                        {
                            plan: {
                                interval: 'ONE_TIME',
                                accessDurationDays: {
                                    not: null,
                                },
                            },
                            startedAt: {
                                lte: now,
                            },
                        },
                    ],
                },
            },
            include: {
                subscription: {
                    include: {
                        plan: true,
                        customer: true,
                    },
                },
                channel: true,
            },
        });
        const actuallyExpired = expiredAccesses.filter((access) => {
            if (access.subscription.plan.interval !== 'ONE_TIME') {
                return true;
            }
            const accessDays = access.subscription.plan.accessDurationDays;
            if (!accessDays) {
                return false;
            }
            const expiresAt = new Date(access.subscription.startedAt);
            expiresAt.setDate(expiresAt.getDate() + accessDays);
            return expiresAt <= now;
        });
        if (actuallyExpired.length === 0) {
            this.logger.debug('No expired channel accesses found');
            return;
        }
        this.logger.log(`Found ${actuallyExpired.length} expired channel accesses`);
        const subscriptionIds = [...new Set(actuallyExpired.map((a) => a.subscriptionId))];
        for (const subscriptionId of subscriptionIds) {
            try {
                await this.channelAccessService.handlePaymentFailure(subscriptionId, 'expired');
                this.logger.debug(`Revoked access for subscription ${subscriptionId}`);
            }
            catch (error) {
                this.logger.error(`Failed to revoke access for subscription ${subscriptionId}: ${error.message}`);
            }
        }
        this.logger.log('Expired channel accesses check complete');
    }
    async cleanupOldInvites() {
        this.logger.log('Starting old invites cleanup...');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await this.prisma.telegramInvite.deleteMany({
            where: {
                status: {
                    in: ['REVOKED', 'EXPIRED'],
                },
                revokedAt: {
                    lte: thirtyDaysAgo,
                },
            },
        });
        this.logger.log(`Cleaned up ${result.count} old invite records`);
    }
    async sendExpirationReminders() {
        this.logger.log('Starting expiration reminders...');
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
        const expiringSubscriptions = await this.prisma.subscription.findMany({
            where: {
                status: 'ACTIVE',
                currentPeriodEnd: {
                    gte: threeDaysFromNow,
                    lt: fourDaysFromNow,
                },
            },
            include: {
                customer: true,
                plan: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        const subscriptionsToNotify = expiringSubscriptions.filter((subscription) => {
            const metadata = subscription.metadata;
            return metadata?.expirationReminderSent !== true;
        });
        this.logger.log(`Found ${subscriptionsToNotify.length} subscriptions expiring soon`);
        for (const subscription of subscriptionsToNotify) {
            try {
                const existingMetadata = subscription.metadata ?? {};
                await this.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        metadata: {
                            ...existingMetadata,
                            expirationReminderSent: true,
                            expirationReminderSentAt: now.toISOString(),
                        },
                    },
                });
                this.logger.debug(`Marked subscription ${subscription.id} for expiration reminder (customer: ${subscription.customer.email || subscription.customer.telegramUserId})`);
            }
            catch (error) {
                this.logger.error(`Failed to process reminder for subscription ${subscription.id}: ${error.message}`);
            }
        }
        this.logger.log('Expiration reminders check complete');
    }
    async cleanupRetentionData() {
        this.logger.log('Starting retention cleanup...');
        const auditRetentionDays = this.getRetentionDays('AUDIT_LOG_RETENTION_DAYS', DEFAULT_AUDIT_LOG_RETENTION_DAYS);
        const paymentRetentionDays = this.getRetentionDays('PAYMENT_EVENT_RETENTION_DAYS', DEFAULT_PAYMENT_EVENT_RETENTION_DAYS);
        const auditCutoff = new Date(Date.now() - auditRetentionDays * DAY_IN_MS);
        const paymentCutoff = new Date(Date.now() - paymentRetentionDays * DAY_IN_MS);
        const [auditResult, paymentResult] = await Promise.all([
            this.prisma.auditLog.deleteMany({
                where: {
                    createdAt: {
                        lt: auditCutoff,
                    },
                },
            }),
            this.prisma.paymentEvent.deleteMany({
                where: {
                    createdAt: {
                        lt: paymentCutoff,
                    },
                },
            }),
        ]);
        this.logger.log(`Retention cleanup complete: auditLogs=${auditResult.count}, paymentEvents=${paymentResult.count}`);
    }
    async handlePendingDataExports() {
        this.logger.log('Starting data export processing...');
        try {
            await this.dataExportsService.processPendingExports();
        }
        catch (error) {
            this.logger.error(`Failed to process data exports: ${error.message}`);
        }
    }
    getRetentionDays(key, fallback) {
        const rawValue = this.config.get(key);
        if (!rawValue) {
            return fallback;
        }
        const parsed = Number.parseInt(rawValue, 10);
        if (Number.isNaN(parsed) || parsed <= 0) {
            return fallback;
        }
        return parsed;
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleExpiredEntitlements", null);
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleExpiredGracePeriods", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleExpiredChannelAccesses", null);
__decorate([
    (0, schedule_1.Cron)('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "cleanupOldInvites", null);
__decorate([
    (0, schedule_1.Cron)('0 10 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "sendExpirationReminders", null);
__decorate([
    (0, schedule_1.Cron)('30 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "cleanupRetentionData", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handlePendingDataExports", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        channel_access_service_1.ChannelAccessService,
        config_1.ConfigService,
        data_exports_service_1.DataExportsService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map