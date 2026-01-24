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
exports.DataExportsController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
const data_exports_service_1 = require("./data-exports.service");
const data_exports_schema_1 = require("./data-exports.schema");
let DataExportsController = class DataExportsController {
    dataExportsService;
    constructor(dataExportsService) {
        this.dataExportsService = dataExportsService;
    }
    async requestExport(user, body) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, body.organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('organizationId is required');
        }
        return this.dataExportsService.requestExport(scopedOrgId, user.userId);
    }
    findAll(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        return this.dataExportsService.findAll(scopedOrgId);
    }
    async findOne(user, id) {
        const exportJob = await this.dataExportsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, exportJob.organizationId);
        return exportJob;
    }
};
exports.DataExportsController = DataExportsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(data_exports_schema_1.createDataExportSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DataExportsController.prototype, "requestExport", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DataExportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DataExportsController.prototype, "findOne", null);
exports.DataExportsController = DataExportsController = __decorate([
    (0, common_1.Controller)('data-exports'),
    __metadata("design:paramtypes", [data_exports_service_1.DataExportsService])
], DataExportsController);
//# sourceMappingURL=data-exports.controller.js.map