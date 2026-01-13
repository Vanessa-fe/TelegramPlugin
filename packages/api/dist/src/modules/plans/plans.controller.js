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
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const plans_schema_1 = require("./plans.schema");
const plans_service_1 = require("./plans.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
let PlansController = class PlansController {
    plansService;
    constructor(plansService) {
        this.plansService = plansService;
    }
    findAll(user, productId, organizationId, includeInactive) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        return this.plansService.findAll({
            productId,
            organizationId: scopedOrgId,
            includeInactive: includeInactive === 'true',
        });
    }
    async findOne(user, id) {
        const plan = await this.plansService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, plan.product.organizationId);
        return plan;
    }
    async create(user, body) {
        const organizationId = await this.plansService.getProductOrganization(body.productId);
        if (!organizationId) {
            throw new common_1.NotFoundException('Produit introuvable pour ce plan');
        }
        (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        return this.plansService.create(body);
    }
    async update(user, id, body) {
        const plan = await this.plansService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, plan.product.organizationId);
        if (body.productId) {
            const organizationId = await this.plansService.getProductOrganization(body.productId);
            if (!organizationId) {
                throw new common_1.NotFoundException('Produit cible introuvable');
            }
            (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        }
        return this.plansService.update(id, body);
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('productId')),
    __param(2, (0, common_1.Query)('organizationId')),
    __param(3, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], PlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(plans_schema_1.createPlanSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(plans_schema_1.updatePlanSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "update", null);
exports.PlansController = PlansController = __decorate([
    (0, common_1.Controller)('plans'),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map