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
exports.LandingPagesController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const landing_pages_schema_1 = require("./landing-pages.schema");
const landing_pages_service_1 = require("./landing-pages.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
let LandingPagesController = class LandingPagesController {
    landingPagesService;
    constructor(landingPagesService) {
        this.landingPagesService = landingPagesService;
    }
    getMyLandingPage(user) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.findByOrganization(organizationId);
    }
    getMyPageSlug(user) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.getOrganizationSlug(organizationId);
    }
    updatePageSlug(user, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.updatePageSlug(organizationId, body);
    }
    createLandingPage(user, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.create(organizationId, body);
    }
    updateLandingPage(user, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.update(organizationId, body);
    }
    publishLandingPage(user) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.publish(organizationId);
    }
    unpublishLandingPage(user) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.unpublish(organizationId);
    }
    bulkUpdateElements(user, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.bulkUpdateElements(organizationId, body);
    }
    addElement(user, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.addElement(organizationId, body);
    }
    updateElement(user, id, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.updateElement(organizationId, id, body);
    }
    deleteElement(user, id) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.deleteElement(organizationId, id);
    }
    reorderElements(user, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.reorderElements(organizationId, body);
    }
    updateSocialLinks(user, body) {
        const organizationId = (0, organization_scope_1.resolveOrganizationScope)(user);
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        return this.landingPagesService.updateSocialLinks(organizationId, body);
    }
};
exports.LandingPagesController = LandingPagesController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "getMyLandingPage", null);
__decorate([
    (0, common_1.Get)('me/slug'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.VIEWER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "getMyPageSlug", null);
__decorate([
    (0, common_1.Patch)('me/slug'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.updatePageSlugSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "updatePageSlug", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.createLandingPageSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "createLandingPage", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.updateLandingPageSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "updateLandingPage", null);
__decorate([
    (0, common_1.Post)('me/publish'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "publishLandingPage", null);
__decorate([
    (0, common_1.Post)('me/unpublish'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "unpublishLandingPage", null);
__decorate([
    (0, common_1.Put)('me/elements'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.bulkUpdateElementsSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "bulkUpdateElements", null);
__decorate([
    (0, common_1.Post)('me/elements'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.createElementSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "addElement", null);
__decorate([
    (0, common_1.Patch)('me/elements/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.updateElementSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "updateElement", null);
__decorate([
    (0, common_1.Delete)('me/elements/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "deleteElement", null);
__decorate([
    (0, common_1.Put)('me/elements/reorder'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.reorderElementsSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "reorderElements", null);
__decorate([
    (0, common_1.Put)('me/social-links'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new common_2.ZodValidationPipe(landing_pages_schema_1.updateSocialLinksSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "updateSocialLinks", null);
exports.LandingPagesController = LandingPagesController = __decorate([
    (0, common_1.Controller)('landing-pages'),
    __metadata("design:paramtypes", [landing_pages_service_1.LandingPagesService])
], LandingPagesController);
//# sourceMappingURL=landing-pages.controller.js.map