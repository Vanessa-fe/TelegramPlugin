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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const common_2 = require("../../common");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organization_scope_1 = require("../auth/utils/organization-scope");
const billing_schema_1 = require("./billing.schema");
const billing_service_1 = require("./billing.service");
let BillingController = class BillingController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    getStripeStatus(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('organizationId is required');
        }
        return this.billingService.getStripeStatus(scopedOrgId);
    }
    createStripeConnectLink(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('organizationId is required');
        }
        return this.billingService.createStripeConnectLink(scopedOrgId);
    }
    createStripeLoginLink(user, organizationId) {
        const scopedOrgId = (0, organization_scope_1.resolveOrganizationScope)(user, organizationId);
        if (!scopedOrgId) {
            throw new common_1.BadRequestException('organizationId is required');
        }
        return this.billingService.createStripeLoginLink(scopedOrgId);
    }
    createCheckoutSession(body) {
        return this.billingService.createCheckoutSession(body);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('stripe/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getStripeStatus", null);
__decorate([
    (0, common_1.Post)('stripe/connect'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "createStripeConnectLink", null);
__decorate([
    (0, common_1.Post)('stripe/login'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPERADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.SUPPORT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "createStripeLoginLink", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(billing_schema_1.createCheckoutSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "createCheckoutSession", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map