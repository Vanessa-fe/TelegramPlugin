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
var AuditLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditLogService = AuditLogService_1 = class AuditLogService {
    prisma;
    logger = new common_1.Logger(AuditLogService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(entry) {
        await this.prisma.auditLog.create({
            data: {
                organizationId: entry.organizationId,
                actorId: entry.actorId ?? null,
                actorType: entry.actorType ?? client_1.AuditActorType.USER,
                action: entry.action,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId ?? null,
                correlationId: entry.correlationId ?? null,
                metadata: entry.metadata ?? undefined,
            },
        });
    }
    async createForSubscription(entry) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: entry.subscriptionId },
            select: { organizationId: true },
        });
        if (!subscription) {
            this.logger.warn(`Audit log skipped: subscription ${entry.subscriptionId} not found`);
            return;
        }
        await this.create({
            organizationId: subscription.organizationId,
            actorId: entry.actorId,
            actorType: entry.actorType,
            action: entry.action,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
            correlationId: entry.correlationId,
            metadata: entry.metadata,
        });
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = AuditLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map