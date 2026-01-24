import { OnModuleInit } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
export declare class MetricsService implements OnModuleInit {
    private readonly registry;
    readonly webhookRequestsTotal: Counter<'provider' | 'event_type' | 'status'>;
    readonly webhookDurationSeconds: Histogram<'provider' | 'event_type'>;
    readonly queueJobsTotal: Counter<'queue' | 'status'>;
    readonly queueJobDurationSeconds: Histogram<'queue'>;
    readonly queueWaitingJobs: Gauge<'queue'>;
    constructor();
    onModuleInit(): void;
    getMetrics(): Promise<string>;
    getContentType(): string;
    recordWebhookRequest(provider: string, eventType: string, status: 'success' | 'error'): void;
    recordWebhookDuration(provider: string, eventType: string, durationSeconds: number): void;
    recordQueueJob(queue: string, status: 'completed' | 'failed'): void;
    recordQueueJobDuration(queue: string, durationSeconds: number): void;
    setQueueWaitingJobs(queue: string, count: number): void;
}
