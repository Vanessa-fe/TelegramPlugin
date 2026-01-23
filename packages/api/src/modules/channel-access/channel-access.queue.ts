import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
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

@Injectable()
export class ChannelAccessQueue implements OnModuleDestroy {
  private readonly logger = new Logger(ChannelAccessQueue.name);
  private readonly connection: IORedis;
  private readonly grantQueue: Queue<GrantAccessPayload>;
  private readonly revokeQueue: Queue<RevokeAccessPayload>;
  private readonly grantDlq: Queue;
  private readonly revokeDlq: Queue;

  // 10 attempts with 5m exponential backoff ~= 42h retry window.
  private static readonly RETRY_ATTEMPTS = 10;
  private static readonly RETRY_BACKOFF_DELAY_MS = 5 * 60 * 1000;

  constructor(private readonly config: ConfigService) {
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

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.grantQueue.close(),
      this.revokeQueue.close(),
      this.grantDlq.close(),
      this.revokeDlq.close(),
      this.connection.quit(),
    ]).catch((error) => {
      this.logger.error('Error shutting down ChannelAccessQueue', error as Error);
    });
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
    const originalJobId = payloadContainer.originalJobId ?? String(job.id ?? jobId);

    const existing = await target.getJob(originalJobId);
    if (existing) {
      await existing.remove();
    }

    await target.add(jobName, parsed, {
      jobId: originalJobId,
      removeOnFail: false,
    });

    await job.remove();
  }
}
