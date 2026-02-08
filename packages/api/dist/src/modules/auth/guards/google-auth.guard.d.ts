import { ExecutionContext } from '@nestjs/common';
declare const GoogleCallbackGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GoogleCallbackGuard extends GoogleCallbackGuard_base {
    handleRequest<TUser = unknown>(err: any, user: TUser | false, info: any, context: ExecutionContext): TUser;
}
export {};
