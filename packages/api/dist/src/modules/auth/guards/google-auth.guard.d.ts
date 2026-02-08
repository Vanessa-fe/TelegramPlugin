import { ExecutionContext } from '@nestjs/common';
declare const GoogleAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GoogleAuthGuard extends GoogleAuthGuard_base {
    getResponse(context: ExecutionContext): import("http").ServerResponse<import("http").IncomingMessage>;
}
export declare class GoogleCallbackGuard extends GoogleAuthGuard {
    handleRequest<TUser = unknown>(err: any, user: TUser | false, info: any, context: ExecutionContext): TUser | null;
}
export {};
