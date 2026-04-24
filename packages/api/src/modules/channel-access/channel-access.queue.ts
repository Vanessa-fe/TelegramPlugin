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

function readBooleanConfig(
  config: ConfigService,
  key: string,
  defaultValue: boolean,
): boolean {
  const value = config.get<string | boolean>(key);
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return defaultValue;
  }
  return !['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase());
}

function readPositiveIntegerConfig(
  config: ConfigService,
  key: string,
  defaultValue: number,
): number {
  const value = config.get<string | number>(key);
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

@Injectable()
export class ChannelAccessQueue implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(ChannelAccessQueue.name);
  private readonly queueEnabled: boolean;
  private readonly metricsEnabled: boolean;
  private readonly metricsIntervalMs: number;
  private readonly connection: IORedis | null = null;
  private readonly grantQueue: Queue<GrantAccessPayload> | null = null;
  private readonly revokeQueue: Queue<RevokeAccessPayload> | null = null;
  private readonly grantDlq: Queue | null = null;
  private readonly revokeDlq: Queue | null = null;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  // 10 attempts with 5m exponential backoff ~= 42h retry window.
  private static readonly RETRY_ATTEMPTS = 10;
  private static readonly RETRY_BACKOFF_DELAY_MS = 5 * 60 * 1000;
  private static readonly DEFAULT_METRICS_INTERVAL_MS = 10 * 60 * 1000;

  constructor(
    private readonly config: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.queueEnabled = readBooleanConfig(
      this.config,
      'CHANNEL_ACCESS_QUEUE_ENABLED',
      true,
    );
    this.metricsEnabled = readBooleanConfig(
      this.config,
      'CHANNEL_ACCESS_QUEUE_METRICS_ENABLED',
      this.queueEnabled,
    );
    this.metricsIntervalMs = readPositiveIntegerConfig(
      this.config,
      'CHANNEL_ACCESS_QUEUE_METRICS_INTERVAL_MS',
      ChannelAccessQueue.DEFAULT_METRICS_INTERVAL_MS,
    );

    if (!this.queueEnabled) {
      this.logger.warn(
        'Channel access queue is disabled; Redis/BullMQ will not be initialized',
      );
      return;
    }

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
    if (!this.queueEnabled || !this.metricsEnabled) {
      return;
    }

    this.metricsInterval = setInterval(() => {
      this.updateQueueMetrics().catch((error) => {
        this.logger.error('Failed to update queue metrics', error as Error);
      });
    }, this.metricsIntervalMs);

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

    const shutdownTasks: Array<Promise<unknown>> = [];
    if (this.grantQueue) shutdownTasks.push(this.grantQueue.close());
    if (this.revokeQueue) shutdownTasks.push(this.revokeQueue.close());
    if (this.grantDlq) shutdownTasks.push(this.grantDlq.close());
    if (this.revokeDlq) shutdownTasks.push(this.revokeDlq.close());
    if (this.connection) shutdownTasks.push(this.connection.quit());

    await Promise.all(shutdownTasks).catch((error) => {
      this.logger.error(
        'Error shutting down ChannelAccessQueue',
        error as Error,
      );
    });
  }

  private async updateQueueMetrics(): Promise<void> {
    if (
      !this.grantQueue ||
      !this.revokeQueue ||
      !this.grantDlq ||
      !this.revokeDlq
    ) {
      return;
    }

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
    if (!this.grantQueue) {
      this.logger.warn(
        `Channel access queue disabled; grant job skipped (subscription=${data.subscriptionId}, channel=${data.channelId})`,
      );
      return;
    }

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
    if (!this.revokeQueue) {
      this.logger.warn(
        `Channel access queue disabled; revoke job skipped (subscription=${data.subscriptionId}, reason=${data.reason})`,
      );
      return;
    }

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
    if (!this.grantDlq || !this.grantQueue) {
      this.logger.warn(
        `Channel access queue disabled; replay skipped (${jobId})`,
      );
      return;
    }

    await this.replayDeadLetter(
      this.grantDlq,
      this.grantQueue,
      GrantAccessPayloadSchema,
      jobId,
      queueNames.grantAccess,
    );
  }

  async replayRevokeAccess(jobId: string): Promise<void> {
    if (!this.revokeDlq || !this.revokeQueue) {
      this.logger.warn(
        `Channel access queue disabled; replay skipped (${jobId})`,
      );
      return;
    }

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
