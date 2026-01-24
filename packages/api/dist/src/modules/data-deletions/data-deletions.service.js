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
var DataDeletionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataDeletionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const channel_access_service_1 = require("../channel-access/channel-access.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const DELETED_EMAIL_DOMAIN = 'example.invalid';
let DataDeletionsService = DataDeletionsService_1 = class DataDeletionsService {
    prisma;
    channelAccessService;
    auditLogService;
    logger = new common_1.Logger(DataDeletionsService_1.name);
    constructor(prisma, channelAccessService, auditLogService) {
        this.prisma = prisma;
        this.channelAccessService = channelAccessService;
        this.auditLogService = auditLogService;
    }
    async deleteCustomer(input) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: input.customerId },
        });
        if (!customer || customer.organizationId !== input.organizationId) {
            throw new common_1.NotFoundException('Client introuvable');
        }
        if (customer.deletedAt) {
            return;
        }
        const now = new Date();
        const subscriptions = await this.prisma.subscription.findMany({
            where: { customerId: input.customerId },
            select: { id: true },
        });
        const subscriptionIds = subscriptions.map((subscription) => subscription.id);
        for (const subscriptionId of subscriptionIds) {
            await this.channelAccessService.handlePaymentFailure(subscriptionId, 'canceled');
            await this.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: client_1.SubscriptionStatus.CANCELED,
                    canceledAt: now,
                    endedAt: now,
                    graceUntil: null,
                },
            });
        }
        if (subscriptionIds.length > 0) {
            await this.prisma.paymentEvent.updateMany({
                where: { subscriptionId: { in: subscriptionIds } },
                data: { payload: {} },
            });
        }
        await this.prisma.customer.update({
            where: { id: input.customerId },
            data: {
                email: null,
                displayName: null,
                telegramUserId: null,
                telegramUsername: null,
                externalId: null,
                metadata: null,
                deletedAt: now,
            },
        });
        await this.auditLogService.create({
            organizationId: input.organizationId,
            actorId: input.actorId ?? null,
            actorType: input.actorId ? client_1.AuditActorType.USER : client_1.AuditActorType.SYSTEM,
            action: 'rgpd.customer.deleted',
            resourceType: 'customer',
            resourceId: input.customerId,
            correlationId: this.resolveCorrelationId(input.correlationId, input.requestId),
            metadata: this.buildMetadata(input.actorRole, input.requestId, {
                subscriptionsRevoked: subscriptionIds.length,
                viaOrganizationDeletion: input.viaOrganizationDeletion ?? false,
            }),
        });
    }
    async deleteOrganization(input) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: input.organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organisation introuvable');
        }
        if (organization.deletedAt) {
            return;
        }
        const now = new Date();
        const customers = await this.prisma.customer.findMany({
            where: { organizationId: input.organizationId },
            select: { id: true },
        });
        for (const customer of customers) {
            await this.deleteCustomer({
                organizationId: input.organizationId,
                customerId: customer.id,
                actorId: input.actorId,
                actorRole: input.actorRole,
                correlationId: input.correlationId,
                requestId: input.requestId,
                viaOrganizationDeletion: true,
            });
        }
        const users = await this.prisma.user.findMany({
            where: { organizationId: input.organizationId },
            select: { id: true },
        });
        for (const user of users) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    email: this.buildDeletedEmail('deleted-user', user.id),
                    firstName: null,
                    lastName: null,
                    passwordHash: null,
                    lastLoginAt: null,
                    isActive: false,
                    organizationId: null,
                },
            });
        }
        const products = await this.prisma.product.findMany({
            where: { organizationId: input.organizationId },
            select: { id: true },
        });
        const productIds = products.map((product) => product.id);
        await this.prisma.product.updateMany({
            where: { organizationId: input.organizationId },
            data: { status: client_1.ProductStatus.ARCHIVED },
        });
        if (productIds.length > 0) {
            await this.prisma.plan.updateMany({
                where: { productId: { in: productIds } },
                data: { isActive: false },
            });
        }
        await this.prisma.channel.updateMany({
            where: { organizationId: input.organizationId },
            data: { isActive: false },
        });
        await this.prisma.organization.update({
            where: { id: input.organizationId },
            data: {
                name: `Deleted Organization ${input.organizationId.slice(0, 8)}`,
                slug: `deleted-${input.organizationId}`,
                billingEmail: this.buildDeletedEmail('deleted-org', input.organizationId),
                stripeAccountId: null,
                saasActive: false,
                metadata: null,
                deletedAt: now,
            },
        });
        await this.auditLogService.create({
            organizationId: input.organizationId,
            actorId: input.actorId ?? null,
            actorType: input.actorId ? client_1.AuditActorType.USER : client_1.AuditActorType.SYSTEM,
            action: 'rgpd.organization.deleted',
            resourceType: 'organization',
            resourceId: input.organizationId,
            correlationId: this.resolveCorrelationId(input.correlationId, input.requestId),
            metadata: this.buildMetadata(input.actorRole, input.requestId, {
                customersDeleted: customers.length,
                usersDeactivated: users.length,
            }),
        });
        this.logger.log(`Organization ${input.organizationId} deleted`);
    }
    buildDeletedEmail(prefix, id) {
        return `${prefix}+${id}@${DELETED_EMAIL_DOMAIN}`;
    }
    resolveCorrelationId(correlationId, requestId) {
        return correlationId ?? requestId ?? null;
    }
    buildMetadata(actorRole, requestId, extra) {
        const metadata = {};
        if (actorRole) {
            metadata.actorRole = actorRole;
        }
        if (requestId) {
            metadata.requestId = requestId;
        }
        if (extra) {
            Object.assign(metadata, extra);
        }
        return Object.keys(metadata).length > 0 ? metadata : undefined;
    }
};
exports.DataDeletionsService = DataDeletionsService;
exports.DataDeletionsService = DataDeletionsService = DataDeletionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        channel_access_service_1.ChannelAccessService,
        audit_log_service_1.AuditLogService])
], DataDeletionsService);
//# sourceMappingURL=data-deletions.service.js.map