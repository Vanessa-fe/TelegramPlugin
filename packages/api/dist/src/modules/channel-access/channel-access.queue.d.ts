import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GrantAccessPayload, RevokeAccessPayload } from '@telegram-plugin/shared';
export declare class ChannelAccessQueue implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private readonly connection;
    private readonly grantQueue;
    private readonly revokeQueue;
    constructor(config: ConfigService);
    onModuleDestroy(): Promise<void>;
    enqueueGrantAccess(payload: GrantAccessPayload): Promise<void>;
    enqueueRevokeAccess(payload: RevokeAccessPayload): Promise<void>;
}
