"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GoogleCallbackGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCallbackGuard = exports.GoogleAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let GoogleAuthGuard = class GoogleAuthGuard extends (0, passport_1.AuthGuard)('google') {
    getResponse(context) {
        const response = context.switchToHttp().getResponse();
        return response.raw;
    }
};
exports.GoogleAuthGuard = GoogleAuthGuard;
exports.GoogleAuthGuard = GoogleAuthGuard = __decorate([
    (0, common_1.Injectable)()
], GoogleAuthGuard);
let GoogleCallbackGuard = GoogleCallbackGuard_1 = class GoogleCallbackGuard extends GoogleAuthGuard {
    logger = new common_1.Logger(GoogleCallbackGuard_1.name);
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        const message = err?.message ||
            info?.message ||
            info?.error_description ||
            'Authentication failed';
        if (err || !user) {
            request.oauthError = message;
            const errMessage = err instanceof Error ? err.message : err ? String(err) : undefined;
            const infoMessage = info && typeof info === 'object'
                ? info.message ||
                    info.error_description ||
                    JSON.stringify(info)
                : info
                    ? String(info)
                    : undefined;
            this.logger.warn({
                err: errMessage,
                info: infoMessage,
            }, 'Google OAuth failed');
            return null;
        }
        return user;
    }
};
exports.GoogleCallbackGuard = GoogleCallbackGuard;
exports.GoogleCallbackGuard = GoogleCallbackGuard = GoogleCallbackGuard_1 = __decorate([
    (0, common_1.Injectable)()
], GoogleCallbackGuard);
//# sourceMappingURL=google-auth.guard.js.map