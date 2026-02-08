import { ExecutionContext } from '@nestjs/common';
declare const GoogleAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GoogleAuthGuard extends GoogleAuthGuard_base {
    handleRequest<TUser = unknown>(err: Error | null, user: TUser | false, _info: unknown, context: ExecutionContext): TUser;
}
export {};
