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
exports.CouponsController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const coupons_schema_1 = require("./coupons.schema");
const coupons_service_1 = require("./coupons.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
const prisma_service_1 = require("../../prisma/prisma.service");
let CouponsController = class CouponsController {
    couponsService;
    prisma;
    constructor(couponsService, prisma) {
        this.couponsService = couponsService;
        this.prisma = prisma;
    }
    findAll(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.couponsService.findAll(scopedOrgId);
    }
    async findOne(user, id) {
        const coupon = await this.couponsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, coupon.organizationId);
        return coupon;
    }
    async getUsages(user, id) {
        const coupon = await this.couponsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, coupon.organizationId);
        return this.couponsService.getUsages(id);
    }
    create(user, body) {
        (0, organization_scope_1.resolveOrganizationScope)(user, body.organizationId);
        return this.couponsService.create(body);
    }
    async update(user, id, body) {
        const coupon = await this.couponsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, coupon.organizationId);
        return this.couponsService.update(id, body);
    }
    async disable(user, id) {
        const coupon = await this.couponsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, coupon.organizationId);
        return this.couponsService.disable(id);
    }
    async validate(body) {
        const plan = await this.prisma.plan.findUnique({
            where: { id: body.planId },
            include: {
                product: {
                    select: { organizationId: true },
                },
            },
        });
        if (!plan) {
            return { valid: false, error: 'Plan introuvable' };
        }
        if (plan.product.organizationId !== body.organizationId) {
            return { valid: false, error: 'Plan introuvable' };
        }
        return this.couponsService.validate(body, plan.priceCents);
    }
};
exports.CouponsController = CouponsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/usages'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "getUsages", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(coupons_schema_1.createCouponSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CouponsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(coupons_schema_1.updateCouponSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "disable", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(coupons_schema_1.validateCouponSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "validate", null);
exports.CouponsController = CouponsController = __decorate([
    (0, common_1.Controller)('coupons'),
    __metadata("design:paramtypes", [coupons_service_1.CouponsService,
        prisma_service_1.PrismaService])
], CouponsController);
//# sourceMappingURL=coupons.controller.js.map