"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetAuthCookies = exports.SET_AUTH_COOKIES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.SET_AUTH_COOKIES_KEY = 'setAuthCookies';
const SetAuthCookies = () => (0, common_1.SetMetadata)(exports.SET_AUTH_COOKIES_KEY, true);
exports.SetAuthCookies = SetAuthCookies;
//# sourceMappingURL=set-auth-cookies.decorator.js.map