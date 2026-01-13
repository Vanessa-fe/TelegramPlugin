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
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });
    this.revokeQueue = new Queue(queueNames.revokeAccess, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.grantQueue.close(),
      this.revokeQueue.close(),
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
}
