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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("../../common");
const auth_service_1 = require("./auth.service");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const public_decorator_1 = require("./decorators/public.decorator");
const set_auth_cookies_decorator_1 = require("./decorators/set-auth-cookies.decorator");
const clear_auth_cookies_decorator_1 = require("./decorators/clear-auth-cookies.decorator");
const cookie_response_interceptor_1 = require("./interceptors/cookie-response.interceptor");
const cookie_clear_interceptor_1 = require("./interceptors/cookie-clear.interceptor");
const auth_schema_1 = require("./auth.schema");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register(body) {
        return this.authService.register(body);
    }
    login(body) {
        return this.authService.login(body.email, body.password);
    }
    refresh(body, req) {
        const refreshTokenFromCookie = req.cookies?.refreshToken;
        const refreshToken = body.refreshToken || refreshTokenFromCookie;
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token manquant');
        }
        return this.authService.refresh(refreshToken);
    }
    logout() {
        return { message: 'Déconnexion réussie' };
    }
    me(user) {
        return this.authService.profile(user.userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, set_auth_cookies_decorator_1.SetAuthCookies)(),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(auth_schema_1.registerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, set_auth_cookies_decorator_1.SetAuthCookies)(),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(auth_schema_1.loginSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, set_auth_cookies_decorator_1.SetAuthCookies)(),
    __param(0, (0, common_1.Body)(new common_2.ZodValidationPipe(auth_schema_1.refreshSchema))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseInterceptors)(cookie_clear_interceptor_1.CookieClearInterceptor),
    (0, clear_auth_cookies_decorator_1.ClearAuthCookies)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    (0, common_1.UseInterceptors)(cookie_response_interceptor_1.CookieResponseInterceptor),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map