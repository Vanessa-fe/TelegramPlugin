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
exports.StorefrontController = void 0;
const common_1 = require("@nestjs/common");
const pipes_1 = require("@nestjs/common/pipes");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const storefront_service_1 = require("./storefront.service");
const landing_pages_service_1 = require("../landing-pages/landing-pages.service");
let StorefrontController = class StorefrontController {
    storefrontService;
    landingPagesService;
    constructor(storefrontService, landingPagesService) {
        this.storefrontService = storefrontService;
        this.landingPagesService = landingPagesService;
    }
    async getProduct(id) {
        const product = await this.storefrontService.getPublicProduct(id);
        if (!product) {
            throw new common_1.NotFoundException('Produit introuvable');
        }
        return product;
    }
    async getProductBySlug(slug, productSlug) {
        const product = await this.storefrontService.getPublicProductBySlug(slug, productSlug);
        if (!product) {
            throw new common_1.NotFoundException('Produit introuvable');
        }
        return product;
    }
    async getOrganizationBySlug(slug) {
        const organization = await this.storefrontService.getPublicOrganization(slug);
        if (!organization) {
            throw new common_1.NotFoundException('Organisation introuvable');
        }
        return organization;
    }
    async getOrganizationProducts(slug) {
        return this.storefrontService.getPublicProductsByOrganization(slug);
    }
    async getPublicLandingPage(creator) {
        const page = await this.landingPagesService.getPublicPage(creator);
        if (!page) {
            throw new common_1.NotFoundException('Page introuvable');
        }
        return page;
    }
    async getPublicLandingPageWithSlug(creator, pageSlug) {
        const page = await this.landingPagesService.getPublicPage(creator, pageSlug);
        if (!page) {
            throw new common_1.NotFoundException('Page introuvable');
        }
        return page;
    }
};
exports.StorefrontController = StorefrontController;
__decorate([
    (0, common_1.Get)('products/:id'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id', new pipes_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Get)('organizations/:slug/products/:productSlug'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('productSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getProductBySlug", null);
__decorate([
    (0, common_1.Get)('organizations/:slug'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getOrganizationBySlug", null);
__decorate([
    (0, common_1.Get)('organizations/:slug/products'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getOrganizationProducts", null);
__decorate([
    (0, common_1.Get)('pages/:creator'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('creator')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getPublicLandingPage", null);
__decorate([
    (0, common_1.Get)('pages/:creator/:pageSlug'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('creator')),
    __param(1, (0, common_1.Param)('pageSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getPublicLandingPageWithSlug", null);
exports.StorefrontController = StorefrontController = __decorate([
    (0, common_1.Controller)('storefront'),
    __metadata("design:paramtypes", [storefront_service_1.StorefrontService,
        landing_pages_service_1.LandingPagesService])
], StorefrontController);
//# sourceMappingURL=storefront.controller.js.map