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
var DataExportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataExportsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const SLA_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
let DataExportsService = DataExportsService_1 = class DataExportsService {
    prisma;
    auditLog;
    config;
    logger = new common_1.Logger(DataExportsService_1.name);
    constructor(prisma, auditLog, config) {
        this.prisma = prisma;
        this.auditLog = auditLog;
        this.config = config;
    }
    async requestExport(organizationId, requestedById) {
        const now = new Date();
        const slaDueAt = new Date(now.getTime() + SLA_DAYS * DAY_IN_MS);
        return this.prisma.dataExport.create({
            data: {
                organizationId,
                requestedById: requestedById ?? null,
                status: 'PENDING',
                requestedAt: now,
                slaDueAt,
            },
        });
    }
    findAll(organizationId) {
        return this.prisma.dataExport.findMany({
            where: organizationId ? { organizationId } : undefined,
            orderBy: { requestedAt: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.dataExport.findUniqueOrThrow({
            where: { id },
        });
    }
    async processPendingExports() {
        const pending = await this.prisma.dataExport.findMany({
            where: { status: 'PENDING' },
            orderBy: { requestedAt: 'asc' },
        });
        for (const exportJob of pending) {
            await this.processExport(exportJob.id);
        }
    }
    async processExport(exportId) {
        const exportJob = await this.prisma.dataExport.findUnique({
            where: { id: exportId },
        });
        if (!exportJob) {
            this.logger.warn(`Data export ${exportId} not found`);
            return;
        }
        if (exportJob.status !== 'PENDING') {
            return;
        }
        await this.prisma.dataExport.update({
            where: { id: exportId },
            data: {
                status: 'PROCESSING',
                startedAt: new Date(),
            },
        });
        try {
            const organization = await this.prisma.organization.findUnique({
                where: { id: exportJob.organizationId },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    billingEmail: true,
                    stripeAccountId: true,
                    saasActive: true,
                    timezone: true,
                    metadata: true,
                    createdAt: true,
                    updatedAt: true,
                    users: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            firstName: true,
                            lastName: true,
                            isActive: true,
                            lastLoginAt: true,
                            organizationId: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                    customers: true,
                    products: {
                        include: {
                            plans: true,
                            channels: {
                                include: {
                                    channel: true,
                                },
                            },
                        },
                    },
                    channels: {
                        include: {
                            invites: true,
                        },
                    },
                    subscriptions: {
                        include: {
                            plan: true,
                            customer: true,
                            entitlements: true,
                            channelAccesses: true,
                        },
                    },
                    paymentEvents: {
                        select: {
                            id: true,
                            organizationId: true,
                            subscriptionId: true,
                            provider: true,
                            type: true,
                            externalId: true,
                            occurredAt: true,
                            processedAt: true,
                            createdAt: true,
                        },
                        orderBy: { occurredAt: 'desc' },
                    },
                    auditLogs: true,
                },
            });
            if (!organization) {
                throw new Error('Organization not found');
            }
            const exportedAt = new Date();
            const payload = {
                exportedAt: exportedAt.toISOString(),
                organization,
            };
            const archivePath = await this.writeArchive(exportId, payload);
            const slaMet = exportJob.slaDueAt
                ? exportedAt <= exportJob.slaDueAt
                : null;
            await this.prisma.dataExport.update({
                where: { id: exportId },
                data: {
                    status: 'COMPLETED',
                    archivePath,
                    completedAt: exportedAt,
                    slaMet,
                },
            });
            await this.auditLog.create({
                organizationId: exportJob.organizationId,
                actorType: client_1.AuditActorType.SYSTEM,
                action: 'rgpd.export.completed',
                resourceType: 'data_export',
                resourceId: exportId,
                correlationId: exportId,
                metadata: {
                    archivePath,
                    slaMet,
                    requestedById: exportJob.requestedById ?? null,
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            await this.prisma.dataExport.update({
                where: { id: exportId },
                data: {
                    status: 'FAILED',
                    errorMessage: message,
                },
            });
            this.logger.error(`Data export ${exportId} failed: ${message}`);
        }
    }
    async writeArchive(exportId, payload) {
        const exportDir = this.resolveExportDirectory();
        await (0, promises_1.mkdir)(exportDir, { recursive: true });
        const archivePath = path_1.default.join(exportDir, `rgpd-export-${exportId}.json`);
        await (0, promises_1.writeFile)(archivePath, JSON.stringify(payload, null, 2), 'utf8');
        return archivePath;
    }
    resolveExportDirectory() {
        const configured = this.config.get('DATA_EXPORT_DIR');
        if (configured) {
            return path_1.default.resolve(configured);
        }
        return path_1.default.resolve(process.cwd(), 'exports');
    }
};
exports.DataExportsService = DataExportsService;
exports.DataExportsService = DataExportsService = DataExportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        config_1.ConfigService])
], DataExportsService);
//# sourceMappingURL=data-exports.service.js.map