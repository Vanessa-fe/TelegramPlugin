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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieClearInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const clear_auth_cookies_decorator_1 = require("../decorators/clear-auth-cookies.decorator");
let CookieClearInterceptor = class CookieClearInterceptor {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    intercept(context, next) {
        const shouldClearCookies = this.reflector.get(clear_auth_cookies_decorator_1.CLEAR_AUTH_COOKIES_KEY, context.getHandler());
        if (!shouldClearCookies) {
            return next.handle();
        }
        const reply = context.switchToHttp().getResponse();
        return next.handle().pipe((0, rxjs_1.map)((data) => {
            reply.setCookie('accessToken', '', {
                httpOnly: true,
                path: '/',
                maxAge: 0,
            });
            reply.setCookie('refreshToken', '', {
                httpOnly: true,
                path: '/',
                maxAge: 0,
            });
            return data;
        }));
    }
};
exports.CookieClearInterceptor = CookieClearInterceptor;
exports.CookieClearInterceptor = CookieClearInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CookieClearInterceptor);
//# sourceMappingURL=cookie-clear.interceptor.js.map