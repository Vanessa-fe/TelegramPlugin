import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GrantAccessPayload, RevokeAccessPayload } from '@telegram-plugin/shared';
import { MetricsService } from '../metrics/metrics.service';
export declare class ChannelAccessQueue implements OnModuleDestroy, OnModuleInit {
    private readonly config;
    private readonly metricsService;
    private readonly logger;
    private readonly connection;
    private readonly grantQueue;
    private readonly revokeQueue;
    private readonly grantDlq;
    private readonly revokeDlq;
    private metricsInterval;
    private static readonly RETRY_ATTEMPTS;
    private static readonly RETRY_BACKOFF_DELAY_MS;
    private static readonly METRICS_INTERVAL_MS;
    constructor(config: ConfigService, metricsService: MetricsService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    private updateQueueMetrics;
    enqueueGrantAccess(payload: GrantAccessPayload): Promise<void>;
    enqueueRevokeAccess(payload: RevokeAccessPayload): Promise<void>;
    replayGrantAccess(jobId: string): Promise<void>;
    replayRevokeAccess(jobId: string): Promise<void>;
    private replayDeadLetter;
}
