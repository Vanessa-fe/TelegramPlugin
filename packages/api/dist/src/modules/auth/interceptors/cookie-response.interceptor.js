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
exports.CookieResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const set_auth_cookies_decorator_1 = require("../decorators/set-auth-cookies.decorator");
let CookieResponseInterceptor = class CookieResponseInterceptor {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    intercept(context, next) {
        const shouldSetCookies = this.reflector.get(set_auth_cookies_decorator_1.SET_AUTH_COOKIES_KEY, context.getHandler());
        if (!shouldSetCookies) {
            return next.handle();
        }
        const reply = context.switchToHttp().getResponse();
        return next.handle().pipe((0, rxjs_1.map)((data) => {
            const isProduction = process.env.NODE_ENV === 'production';
            reply.setCookie('accessToken', data.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'strict' : 'lax',
                path: '/',
                maxAge: 15 * 60,
            });
            reply.setCookie('refreshToken', data.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'strict' : 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60,
            });
            return { user: data.user };
        }));
    }
};
exports.CookieResponseInterceptor = CookieResponseInterceptor;
exports.CookieResponseInterceptor = CookieResponseInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CookieResponseInterceptor);
//# sourceMappingURL=cookie-response.interceptor.js.map