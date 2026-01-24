import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  readonly webhookRequestsTotal: Counter<'provider' | 'event_type' | 'status'>;
  readonly webhookDurationSeconds: Histogram<'provider' | 'event_type'>;
  readonly queueJobsTotal: Counter<'queue' | 'status'>;
  readonly queueJobDurationSeconds: Histogram<'queue'>;
  readonly queueWaitingJobs: Gauge<'queue'>;

  constructor() {
    this.registry = new Registry();

    this.webhookRequestsTotal = new Counter({
      name: 'webhook_requests_total',
      help: 'Total number of webhook requests received',
      labelNames: ['provider', 'event_type', 'status'],
      registers: [this.registry],
    });

    this.webhookDurationSeconds = new Histogram({
      name: 'webhook_duration_seconds',
      help: 'Duration of webhook processing in seconds',
      labelNames: ['provider', 'event_type'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.queueJobsTotal = new Counter({
      name: 'queue_jobs_total',
      help: 'Total number of queue jobs processed',
      labelNames: ['queue', 'status'],
      registers: [this.registry],
    });

    this.queueJobDurationSeconds = new Histogram({
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue job processing in seconds',
      labelNames: ['queue'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.queueWaitingJobs = new Gauge({
      name: 'queue_waiting_jobs',
      help: 'Number of jobs waiting in queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  recordWebhookRequest(
    provider: string,
    eventType: string,
    status: 'success' | 'error',
  ): void {
    this.webhookRequestsTotal.inc({ provider, event_type: eventType, status });
  }

  recordWebhookDuration(
    provider: string,
    eventType: string,
    durationSeconds: number,
  ): void {
    this.webhookDurationSeconds.observe(
      { provider, event_type: eventType },
      durationSeconds,
    );
  }

  recordQueueJob(queue: string, status: 'completed' | 'failed'): void {
    this.queueJobsTotal.inc({ queue, status });
  }

  recordQueueJobDuration(queue: string, durationSeconds: number): void {
    this.queueJobDurationSeconds.observe({ queue }, durationSeconds);
  }

  setQueueWaitingJobs(queue: string, count: number): void {
    this.queueWaitingJobs.set({ queue }, count);
  }
}
