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
exports.TeamController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
const team_schema_1 = require("./team.schema");
const team_service_1 = require("./team.service");
let TeamController = class TeamController {
    teamService;
    constructor(teamService) {
        this.teamService = teamService;
    }
    listMembers(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.listMembers(scopedOrgId);
    }
    updateMemberRole(user, id, body, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.updateMemberRole(scopedOrgId, id, user.userId, body);
    }
    deactivateMember(user, id, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.deactivateMember(scopedOrgId, id, user.userId);
    }
    reactivateMember(user, id, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.reactivateMember(scopedOrgId, id);
    }
    removeMember(user, id, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.removeMember(scopedOrgId, id, user.userId);
    }
    listInvites(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.listPendingInvites(scopedOrgId);
    }
    createInvite(user, body) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, body.organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.createInvite(scopedOrgId, user.userId, body);
    }
    revokeInvite(user, id, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.teamService.revokeInvite(scopedOrgId, id);
    }
    getPublicInvite(token) {
        return this.teamService.getPublicInvite(token);
    }
    acceptInvite(body) {
        return this.teamService.acceptInvite(body);
    }
};
exports.TeamController = TeamController;
__decorate([
    (0, common_1.Get)('members'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "listMembers", null);
__decorate([
    (0, common_1.Patch)('members/:id/role'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(team_schema_1.updateTeamMemberRoleSchema))),
    __param(3, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Patch)('members/:id/deactivate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "deactivateMember", null);
__decorate([
    (0, common_1.Patch)('members/:id/reactivate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "reactivateMember", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)('invites'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "listInvites", null);
__decorate([
    (0, common_1.Post)('invites'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(team_schema_1.createTeamInviteSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "createInvite", null);
__decorate([
    (0, common_1.Delete)('invites/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "revokeInvite", null);
__decorate([
    (0, common_1.Get)('invites/public/:token'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "getPublicInvite", null);
__decorate([
    (0, common_1.Post)('invites/accept'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(team_schema_1.acceptTeamInviteSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "acceptInvite", null);
exports.TeamController = TeamController = __decorate([
    (0, common_1.Controller)('team'),
    __metadata("design:paramtypes", [team_service_1.TeamService])
], TeamController);
//# sourceMappingURL=team.controller.js.map