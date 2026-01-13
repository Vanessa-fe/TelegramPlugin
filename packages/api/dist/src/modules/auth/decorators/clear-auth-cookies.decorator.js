"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearAuthCookies = exports.CLEAR_AUTH_COOKIES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CLEAR_AUTH_COOKIES_KEY = 'clearAuthCookies';
const ClearAuthCookies = () => (0, common_1.SetMetadata)(exports.CLEAR_AUTH_COOKIES_KEY, true);
exports.ClearAuthCookies = ClearAuthCookies;
//# sourceMappingURL=clear-auth-cookies.decorator.js.map