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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(organizationId) {
        return this.prisma.customer.findMany({
            where: organizationId ? { organizationId } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                organization: true,
                subscriptions: true,
                channelAccesses: true,
            },
        });
    }
    findOne(id) {
        return this.prisma.customer.findUniqueOrThrow({
            where: { id },
            include: {
                organization: true,
                subscriptions: true,
                channelAccesses: true,
            },
        });
    }
    create(data) {
        const payload = {
            organization: { connect: { id: data.organizationId } },
            email: data.email?.toLowerCase(),
            displayName: data.displayName,
            telegramUserId: data.telegramUserId,
            telegramUsername: data.telegramUsername?.toLowerCase(),
            externalId: data.externalId,
            metadata: data.metadata,
        };
        return this.prisma.customer.create({ data: payload });
    }
    update(id, data) {
        const payload = {
            ...(data.organizationId && {
                organization: { connect: { id: data.organizationId } },
            }),
            ...(data.email !== undefined && { email: data.email?.toLowerCase() }),
            ...(data.displayName !== undefined && { displayName: data.displayName }),
            ...(data.telegramUserId !== undefined && {
                telegramUserId: data.telegramUserId,
            }),
            ...(data.telegramUsername !== undefined && {
                telegramUsername: data.telegramUsername?.toLowerCase(),
            }),
            ...(data.externalId !== undefined && { externalId: data.externalId }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
        };
        return this.prisma.customer.update({
            where: { id },
            data: payload,
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map