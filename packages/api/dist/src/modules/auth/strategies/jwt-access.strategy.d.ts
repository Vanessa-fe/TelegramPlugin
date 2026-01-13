import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../auth.types';
declare const JwtAccessStrategy_base: new (...args: any) => any;
export declare class JwtAccessStrategy extends JwtAccessStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): {
        userId: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        organizationId: string | null | undefined;
    };
}
export {};
