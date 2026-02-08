"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCallbackGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let GoogleCallbackGuard = class GoogleCallbackGuard extends (0, passport_1.AuthGuard)('google') {
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        const message = err?.message ||
            info?.message ||
            info?.error_description ||
            'Authentication failed';
        if (err || !user) {
            request.oauthError = message;
            throw new common_1.UnauthorizedException(message);
        }
        return user;
    }
};
exports.GoogleCallbackGuard = GoogleCallbackGuard;
exports.GoogleCallbackGuard = GoogleCallbackGuard = __decorate([
    (0, common_1.Injectable)()
], GoogleCallbackGuard);
//# sourceMappingURL=google-auth.guard.js.map