import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import {
  GrantAccessPayload as GrantAccessPayloadSchema,
  RevokeAccessPayload as RevokeAccessPayloadSchema,
  queueNames,
} from '@telegram-plugin/shared';
import type {
  GrantAccessPayload,
  RevokeAccessPayload,
} from '@telegram-plugin/shared';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class ChannelAccessQueue implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(ChannelAccessQueue.name);
  private readonly connection: IORedis;
  private readonly grantQueue: Queue<GrantAccessPayload>;
  private readonly revokeQueue: Queue<RevokeAccessPayload>;
  private readonly grantDlq: Queue;
  private readonly revokeDlq: Queue;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  // 10 attempts with 5m exponential backoff ~= 42h retry window.
  private static readonly RETRY_ATTEMPTS = 10;
  private static readonly RETRY_BACKOFF_DELAY_MS = 5 * 60 * 1000;
  private static readonly METRICS_INTERVAL_MS = 15_000;

  constructor(
    private readonly config: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL is not configured');
    }

    this.connection = new IORedis(redisUrl);
    this.grantQueue = new Queue(queueNames.grantAccess, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: ChannelAccessQueue.RETRY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: ChannelAccessQueue.RETRY_BACKOFF_DELAY_MS,
        },
      },
    });
    this.revokeQueue = new Queue(queueNames.revokeAccess, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: ChannelAccessQueue.RETRY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: ChannelAccessQueue.RETRY_BACKOFF_DELAY_MS,
        },
      },
    });
    this.grantDlq = new Queue(queueNames.grantAccessDlq, {
      connection: this.connection,
    });
    this.revokeDlq = new Queue(queueNames.revokeAccessDlq, {
      connection: this.connection,
    });
  }

  onModuleInit(): void {
    this.metricsInterval = setInterval(() => {
      this.updateQueueMetrics().catch((error) => {
        this.logger.error('Failed to update queue metrics', error as Error);
      });
    }, ChannelAccessQueue.METRICS_INTERVAL_MS);

    this.updateQueueMetrics().catch((error) => {
      this.logger.error(
        'Failed to update initial queue metrics',
        error as Error,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    await Promise.all([
      this.grantQueue.close(),
      this.revokeQueue.close(),
      this.grantDlq.close(),
      this.revokeDlq.close(),
      this.connection.quit(),
    ]).catch((error) => {
      this.logger.error(
        'Error shutting down ChannelAccessQueue',
        error as Error,
      );
    });
  }

  private async updateQueueMetrics(): Promise<void> {
    const [grantCounts, revokeCounts, grantDlqCounts, revokeDlqCounts] =
      await Promise.all([
        this.grantQueue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
        ),
        this.revokeQueue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
        ),
        this.grantDlq.getJobCounts('waiting'),
        this.revokeDlq.getJobCounts('waiting'),
      ]);

    this.metricsService.setQueueWaitingJobs(
      queueNames.grantAccess,
      grantCounts.waiting + grantCounts.active,
    );
    this.metricsService.setQueueWaitingJobs(
      queueNames.revokeAccess,
      revokeCounts.waiting + revokeCounts.active,
    );
    this.metricsService.setQueueWaitingJobs(
      queueNames.grantAccessDlq,
      grantDlqCounts.waiting,
    );
    this.metricsService.setQueueWaitingJobs(
      queueNames.revokeAccessDlq,
      revokeDlqCounts.waiting,
    );
  }

  async enqueueGrantAccess(payload: GrantAccessPayload): Promise<void> {
    const data = GrantAccessPayloadSchema.parse(payload);
    const jobId = `grant:${data.subscriptionId}:${data.channelId}`;

    await this.grantQueue.add(queueNames.grantAccess, data, {
      jobId,
      removeOnFail: false,
      priority: 1,
    });

    this.logger.debug(
      `Grant access job enqueued (subscription=${data.subscriptionId}, channel=${data.channelId})`,
    );
  }

  async enqueueRevokeAccess(payload: RevokeAccessPayload): Promise<void> {
    const data = RevokeAccessPayloadSchema.parse(payload);
    const jobId = `revoke:${data.subscriptionId}:${data.reason}`;

    await this.revokeQueue.add(queueNames.revokeAccess, data, {
      jobId,
      removeOnFail: false,
    });

    this.logger.debug(
      `Revoke access job enqueued (subscription=${data.subscriptionId}, reason=${data.reason})`,
    );
  }

  async replayGrantAccess(jobId: string): Promise<void> {
    await this.replayDeadLetter(
      this.grantDlq,
      this.grantQueue,
      GrantAccessPayloadSchema,
      jobId,
      queueNames.grantAccess,
    );
  }

  async replayRevokeAccess(jobId: string): Promise<void> {
    await this.replayDeadLetter(
      this.revokeDlq,
      this.revokeQueue,
      RevokeAccessPayloadSchema,
      jobId,
      queueNames.revokeAccess,
    );
  }

  private async replayDeadLetter<T>(
    dlq: Queue,
    target: Queue<T>,
    schema: { parse: (payload: unknown) => T },
    jobId: string,
    jobName: string,
  ): Promise<void> {
    const job = await dlq.getJob(jobId);
    if (!job) {
      throw new Error(`DLQ job ${jobId} not found`);
    }

    const payloadContainer = job.data as {
      payload?: unknown;
      originalJobId?: string;
    };
    const payload = payloadContainer.payload ?? job.data;
    const parsed = schema.parse(payload);
    const originalJobId =
      payloadContainer.originalJobId ?? String(job.id ?? jobId);

    const existing = await target.getJob(originalJobId);
    if (existing) {
      await existing.remove();
    }

    await (target as Queue).add(jobName, parsed, {
      jobId: originalJobId,
      removeOnFail: false,
    });

    await job.remove();
  }
}
