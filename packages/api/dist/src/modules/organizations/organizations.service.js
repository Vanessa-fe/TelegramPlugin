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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let OrganizationsService = class OrganizationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(data) {
        const payload = {
            name: data.name,
            slug: data.slug,
            billingEmail: data.billingEmail,
            saasActive: data.saasActive ?? false,
            timezone: data.timezone ?? 'UTC',
            metadata: data.metadata,
        };
        return this.prisma.organization.create({ data: payload });
    }
    findAll() {
        return this.prisma.organization.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.organization.findUniqueOrThrow({
            where: { id },
        });
    }
    update(id, data) {
        const update = {
            ...(data.name && { name: data.name }),
            ...(data.slug && { slug: data.slug }),
            ...(data.billingEmail && { billingEmail: data.billingEmail }),
            ...(data.saasActive !== undefined && { saasActive: data.saasActive }),
            ...(data.timezone && { timezone: data.timezone }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
        };
        return this.prisma.organization.update({
            where: { id },
            data: update,
        });
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map