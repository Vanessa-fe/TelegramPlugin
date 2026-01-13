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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(data) {
        const payload = {
            name: data.name.trim(),
            description: data.description,
            status: data.status ?? client_1.ProductStatus.DRAFT,
            metadata: data.metadata,
            organization: {
                connect: { id: data.organizationId },
            },
        };
        return this.prisma.product.create({ data: payload });
    }
    findAll(organizationId) {
        return this.prisma.product.findMany({
            where: organizationId ? { organizationId } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.product.findUniqueOrThrow({
            where: { id },
        });
    }
    update(id, data) {
        const payload = {
            ...(data.name && { name: data.name.trim() }),
            ...(data.description && { description: data.description }),
            ...(data.status && { status: data.status }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
            ...(data.organizationId && {
                organization: { connect: { id: data.organizationId } },
            }),
        };
        return this.prisma.product.update({
            where: { id },
            data: payload,
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map