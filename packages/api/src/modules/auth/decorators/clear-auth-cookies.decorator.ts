import { SetMetadata } from '@nestjs/common';

export const CLEAR_AUTH_COOKIES_KEY = 'clearAuthCookies';
export const ClearAuthCookies = () => SetMetadata(CLEAR_AUTH_COOKIES_KEY, true);
