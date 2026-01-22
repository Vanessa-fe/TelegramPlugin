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
exports.ChannelsController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const channels_schema_1 = require("./channels.schema");
const channels_service_1 = require("./channels.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
let ChannelsController = class ChannelsController {
    channelsService;
    constructor(channelsService) {
        this.channelsService = channelsService;
    }
    findAll(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new Error('Organization ID is required');
        }
        return this.channelsService.findAll(scopedOrgId);
    }
    async findOne(user, id) {
        const channel = await this.channelsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, channel.organizationId);
        return channel;
    }
    create(user, body) {
        (0, organization_scope_1.resolveOrganizationScope)(user, body.organizationId);
        return this.channelsService.create(body);
    }
    async update(user, id, body) {
        const channel = await this.channelsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, channel.organizationId);
        if (body.organizationId) {
            (0, organization_scope_1.resolveOrganizationScope)(user, body.organizationId);
        }
        return this.channelsService.update(id, body);
    }
    async getAccesses(user, id) {
        const channel = await this.channelsService.findOne(id);
        (0, organization_scope_1.resolveOrganizationScope)(user, channel.organizationId);
        return this.channelsService.getAccesses(id);
    }
};
exports.ChannelsController = ChannelsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(channels_schema_1.createChannelSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(channels_schema_1.updateChannelSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/accesses'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getAccesses", null);
exports.ChannelsController = ChannelsController = __decorate([
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channels_service_1.ChannelsService])
], ChannelsController);
//# sourceMappingURL=channels.controller.js.map