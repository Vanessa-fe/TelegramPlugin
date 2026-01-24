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
exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const organizations_schema_1 = require("./organizations.schema");
const organizations_service_1 = require("./organizations.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
const data_deletions_service_1 = require("../data-deletions/data-deletions.service");
let OrganizationsController = class OrganizationsController {
    organizationsService;
    dataDeletionsService;
    constructor(organizationsService, dataDeletionsService) {
        this.organizationsService = organizationsService;
        this.dataDeletionsService = dataDeletionsService;
    }
    findAll() {
        return this.organizationsService.findAll();
    }
    findOne(user, id) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, id) ?? id;
        return this.organizationsService.findOne(scopedOrgId);
    }
    create(body) {
        return this.organizationsService.create(body);
    }
    update(user, id, body) {
        if (user.role !== client_1.UserRole.SUPERADMIN && body.saasActive !== undefined) {
            throw new common_1.ForbiddenException("Seul un super-admin peut modifier l'abonnement SaaS");
        }
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, id) ?? id;
        return this.organizationsService.update(scopedOrgId, body);
    }
    async deleteOrganization(user, id, correlationId, requestId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, id) ?? id;
        await this.dataDeletionsService.deleteOrganization({
            organizationId: scopedOrgId,
            actorId: user.userId,
            actorRole: user.role,
            correlationId,
            requestId,
        });
        return {
            message: 'Organization deletion completed',
        };
    }
    async deleteCustomer(user, orgId, customerId, correlationId, requestId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, orgId) ?? orgId;
        await this.dataDeletionsService.deleteCustomer({
            organizationId: scopedOrgId,
            customerId,
            actorId: user.userId,
            actorRole: user.role,
            correlationId,
            requestId,
        });
        return {
            message: 'Customer deletion completed',
        };
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(organizations_schema_1.createOrganizationSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(organizations_schema_1.updateOrganizationSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Headers)('x-correlation-id')),
    __param(3, (0, common_1.Headers)('x-request-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "deleteOrganization", null);
__decorate([
    (0, common_1.Delete)(':orgId/customers/:customerId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Param)('customerId', new pipes_1.ParseUUIDPipe())),
    __param(3, (0, common_1.Headers)('x-correlation-id')),
    __param(4, (0, common_1.Headers)('x-request-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "deleteCustomer", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, common_1.Controller)('organizations'),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService,
        data_deletions_service_1.DataDeletionsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map