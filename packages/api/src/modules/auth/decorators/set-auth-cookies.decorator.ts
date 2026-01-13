import { SetMetadata } from '@nestjs/common';

export const SET_AUTH_COOKIES_KEY = 'setAuthCookies';
export const SetAuthCookies = () => SetMetadata(SET_AUTH_COOKIES_KEY, true);
