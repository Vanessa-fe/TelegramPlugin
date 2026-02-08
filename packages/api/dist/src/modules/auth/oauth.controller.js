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
exports.OAuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const public_decorator_1 = require("./decorators/public.decorator");
const oauth_service_1 = require("./oauth.service");
const google_auth_guard_1 = require("./guards/google-auth.guard");
let OAuthController = class OAuthController {
    oauthService;
    config;
    constructor(oauthService, config) {
        this.oauthService = oauthService;
        this.config = config;
    }
    googleAuth() {
    }
    async googleCallback(req, reply) {
        const successUrl = this.config.get('OAUTH_SUCCESS_REDIRECT') ?? '/dashboard';
        const failureUrl = this.config.get('OAUTH_FAILURE_REDIRECT') ??
            '/login?error=oauth_failed';
        if (req.oauthError || !req.user) {
            reply.redirect(failureUrl);
            return;
        }
        try {
            const authResult = await this.oauthService.handleOAuthLogin(req.user);
            const isProduction = process.env.NODE_ENV === 'production';
            const sameSite = isProduction ? 'none' : 'lax';
            reply.setCookie('accessToken', authResult.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite,
                path: '/',
                maxAge: 15 * 60,
            });
            reply.setCookie('refreshToken', authResult.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite,
                path: '/',
                maxAge: 7 * 24 * 60 * 60,
            });
            reply.redirect(successUrl);
        }
        catch {
            reply.redirect(failureUrl);
        }
    }
};
exports.OAuthController = OAuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "googleAuth", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleCallbackGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "googleCallback", null);
exports.OAuthController = OAuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [oauth_service_1.OAuthService,
        config_1.ConfigService])
], OAuthController);
//# sourceMappingURL=oauth.controller.js.map