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
exports.AffiliatesController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const affiliates_schema_1 = require("./affiliates.schema");
const affiliates_service_1 = require("./affiliates.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
let AffiliatesController = class AffiliatesController {
    affiliatesService;
    constructor(affiliatesService) {
        this.affiliatesService = affiliatesService;
    }
    findAll(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.affiliatesService.findAll(scopedOrgId);
    }
    async findOne(user, id) {
        const affiliate = await this.affiliatesService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, affiliate.organizationId);
        return affiliate;
    }
    async getReferrals(user, id) {
        const affiliate = await this.affiliatesService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, affiliate.organizationId);
        return this.affiliatesService.getReferrals(id);
    }
    async getPayouts(user, id) {
        const affiliate = await this.affiliatesService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, affiliate.organizationId);
        return this.affiliatesService.getPayouts(id);
    }
    create(user, body) {
        (0, organization_scope_1.resolveOrganizationScope)(user, body.organizationId);
        return this.affiliatesService.create(body);
    }
    async update(user, id, body) {
        const affiliate = await this.affiliatesService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, affiliate.organizationId);
        return this.affiliatesService.update(id, body);
    }
    async deactivate(user, id) {
        const affiliate = await this.affiliatesService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, affiliate.organizationId);
        return this.affiliatesService.deactivate(id);
    }
    async createPayout(user, id, body) {
        const affiliate = await this.affiliatesService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, affiliate.organizationId);
        return this.affiliatesService.createPayout(id, body);
    }
    async updatePayout(user, payoutId, body) {
        const payout = await this.affiliatesService.updatePayout(payoutId, body);
        const affiliate = await this.affiliatesService.findOne(payout.affiliateId);
        (0, organization_scope_1.resolveOrganizationScope)(user, affiliate.organizationId);
        return payout;
    }
    async validate(body) {
        return this.affiliatesService.validate(body);
    }
};
exports.AffiliatesController = AffiliatesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AffiliatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/referrals'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "getReferrals", null);
__decorate([
    (0, common_1.Get)(':id/payouts'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "getPayouts", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(affiliates_schema_1.createAffiliateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AffiliatesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(affiliates_schema_1.updateAffiliateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':id/payouts'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(affiliates_schema_1.createPayoutSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "createPayout", null);
__decorate([
    (0, common_1.Patch)('payouts/:payoutId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('payoutId', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(affiliates_schema_1.updatePayoutSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "updatePayout", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(affiliates_schema_1.validateAffiliateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AffiliatesController.prototype, "validate", null);
exports.AffiliatesController = AffiliatesController = __decorate([
    (0, common_1.Controller)('affiliates'),
    __metadata("design:paramtypes", [affiliates_service_1.AffiliatesService])
], AffiliatesController);
//# sourceMappingURL=affiliates.controller.js.map