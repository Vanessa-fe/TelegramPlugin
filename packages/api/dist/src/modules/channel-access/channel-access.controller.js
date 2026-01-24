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
exports.ChannelAccessController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const channel_access_service_1 = require("./channel-access.service");
const channel_access_queue_1 = require("./channel-access.queue");
const audit_log_service_1 = require("../audit-log/audit-log.service");
let ChannelAccessController = class ChannelAccessController {
    channelAccessService;
    channelAccessQueue;
    auditLogService;
    constructor(channelAccessService, channelAccessQueue, auditLogService) {
        this.channelAccessService = channelAccessService;
        this.channelAccessQueue = channelAccessQueue;
        this.auditLogService = auditLogService;
    }
    async grantAccess(body) {
        await this.channelAccessService.handlePaymentSuccess(body.subscriptionId, 'STRIPE');
        return {
            message: 'Access grant initiated successfully',
        };
    }
    async revokeAccess(body) {
        const reason = body.reason === 'manual' ? 'canceled' : body.reason;
        await this.channelAccessService.handlePaymentFailure(body.subscriptionId, reason);
        return {
            message: 'Access revoke initiated successfully',
        };
    }
    async replayDeadLetter(user, body, correlationId, requestId) {
        if (body.queue === 'grant') {
            await this.channelAccessQueue.replayGrantAccess(body.jobId);
        }
        else if (body.queue === 'revoke') {
            await this.channelAccessQueue.replayRevokeAccess(body.jobId);
        }
        else {
            throw new common_1.BadRequestException('Invalid queue selection');
        }
        const subscriptionId = this.parseSubscriptionId(body.jobId);
        if (subscriptionId) {
            const resolvedCorrelationId = this.resolveCorrelationId(correlationId, requestId);
            const metadata = this.buildAuditMetadata(user.role, requestId, {
                queue: body.queue,
                jobId: body.jobId,
                subscriptionId,
            });
            await this.auditLogService.createForSubscription({
                subscriptionId,
                actorId: user.userId,
                action: 'admin.access.replay',
                resourceType: 'access_job',
                resourceId: body.jobId,
                correlationId: resolvedCorrelationId,
                metadata,
            });
        }
        return {
            message: 'Replay initiated successfully',
        };
    }
    async supportGrantAccess(user, body, correlationId, requestId) {
        await this.channelAccessService.handlePaymentSuccess(body.subscriptionId, 'STRIPE');
        const resolvedCorrelationId = this.resolveCorrelationId(correlationId, requestId);
        const metadata = this.buildAuditMetadata(user.role, requestId);
        await this.auditLogService.createForSubscription({
            subscriptionId: body.subscriptionId,
            actorId: user.userId,
            action: 'support.access.grant',
            resourceType: 'subscription',
            resourceId: body.subscriptionId,
            correlationId: resolvedCorrelationId,
            metadata,
        });
        return {
            message: 'Support access grant initiated successfully',
        };
    }
    async supportRevokeAccess(user, body, correlationId, requestId) {
        const reason = body.reason === 'manual' ? 'canceled' : body.reason;
        await this.channelAccessService.handlePaymentFailure(body.subscriptionId, reason);
        const resolvedCorrelationId = this.resolveCorrelationId(correlationId, requestId);
        const metadata = this.buildAuditMetadata(user.role, requestId, {
            reason: body.reason,
        });
        await this.auditLogService.createForSubscription({
            subscriptionId: body.subscriptionId,
            actorId: user.userId,
            action: 'support.access.revoke',
            resourceType: 'subscription',
            resourceId: body.subscriptionId,
            correlationId: resolvedCorrelationId,
            metadata,
        });
        return {
            message: 'Support access revoke initiated successfully',
        };
    }
    async supportReplayDeadLetter(user, body, correlationId, requestId) {
        if (body.queue === 'grant') {
            await this.channelAccessQueue.replayGrantAccess(body.jobId);
        }
        else if (body.queue === 'revoke') {
            await this.channelAccessQueue.replayRevokeAccess(body.jobId);
        }
        else {
            throw new common_1.BadRequestException('Invalid queue selection');
        }
        const subscriptionId = this.parseSubscriptionId(body.jobId);
        if (subscriptionId) {
            const resolvedCorrelationId = this.resolveCorrelationId(correlationId, requestId);
            const metadata = this.buildAuditMetadata(user.role, requestId, {
                queue: body.queue,
                jobId: body.jobId,
                subscriptionId,
            });
            await this.auditLogService.createForSubscription({
                subscriptionId,
                actorId: user.userId,
                action: 'support.access.replay',
                resourceType: 'access_job',
                resourceId: body.jobId,
                correlationId: resolvedCorrelationId,
                metadata,
            });
        }
        return {
            message: 'Support replay initiated successfully',
        };
    }
    parseSubscriptionId(jobId) {
        const segments = jobId.split(':');
        if (segments.length < 2) {
            return null;
        }
        return segments[1] || null;
    }
    resolveCorrelationId(correlationId, requestId) {
        return correlationId ?? requestId ?? null;
    }
    buildAuditMetadata(actorRole, requestId, extra) {
        const metadata = {
            actorRole,
        };
        if (requestId) {
            metadata.requestId = requestId;
        }
        if (extra) {
            Object.assign(metadata, extra);
        }
        return metadata;
    }
};
exports.ChannelAccessController = ChannelAccessController;
__decorate([
    (0, common_1.Post)('grant'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelAccessController.prototype, "grantAccess", null);
__decorate([
    (0, common_1.Post)('revoke'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelAccessController.prototype, "revokeAccess", null);
__decorate([
    (0, common_1.Post)('replay'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-correlation-id')),
    __param(3, (0, common_1.Headers)('x-request-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChannelAccessController.prototype, "replayDeadLetter", null);
__decorate([
    (0, common_1.Post)('support/grant'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPPORT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-correlation-id')),
    __param(3, (0, common_1.Headers)('x-request-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChannelAccessController.prototype, "supportGrantAccess", null);
__decorate([
    (0, common_1.Post)('support/revoke'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPPORT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-correlation-id')),
    __param(3, (0, common_1.Headers)('x-request-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChannelAccessController.prototype, "supportRevokeAccess", null);
__decorate([
    (0, common_1.Post)('support/replay'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPPORT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-correlation-id')),
    __param(3, (0, common_1.Headers)('x-request-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChannelAccessController.prototype, "supportReplayDeadLetter", null);
exports.ChannelAccessController = ChannelAccessController = __decorate([
    (0, common_1.Controller)('access'),
    __metadata("design:paramtypes", [channel_access_service_1.ChannelAccessService,
        channel_access_queue_1.ChannelAccessQueue,
        audit_log_service_1.AuditLogService])
], ChannelAccessController);
//# sourceMappingURL=channel-access.controller.js.map