import {
  Injectable,
  Logger,
<<<<<<< HEAD
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  initPostHog,
  getPostHog,
  shutdownPostHog,
  ServerEvents,
} from '@telegram-plugin/shared';
import type { PostHog } from 'posthog-node';
=======
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

export const ServerEvents = {
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  PLAN_SELECTED: 'plan_selected',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_ISSUED: 'refund_issued',
  CHANNEL_ACCESS_GRANTED: 'channel_access_granted',
  CHANNEL_ACCESS_REVOKED: 'channel_access_revoked',
  PRODUCT_CREATED: 'product_created',
  PLAN_CREATED: 'plan_created',
  CHANNEL_CONNECTED: 'channel_connected',
  CHANNEL_DISCONNECTED: 'channel_disconnected',
} as const;
>>>>>>> master

@Injectable()
export class PostHogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private client: PostHog | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectToken = this.config.get<string>('POSTHOG_PROJECT_TOKEN');
    const host = this.config.get<string>('POSTHOG_HOST');

    if (!projectToken) {
      this.logger.warn(
        'PostHog disabled: POSTHOG_PROJECT_TOKEN not configured',
      );
      return;
    }

<<<<<<< HEAD
    this.client = initPostHog({
      apiKey: projectToken,
=======
    this.client = new PostHog(projectToken, {
>>>>>>> master
      host: host ?? 'https://eu.i.posthog.com',
    });

    this.logger.log('PostHog initialized');
  }

  async onModuleDestroy() {
<<<<<<< HEAD
    await shutdownPostHog();
=======
    await this.client?.shutdown();
    this.client = null;
>>>>>>> master
    this.logger.log('PostHog shutdown completed');
  }

  get events() {
    return ServerEvents;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): void {
    if (!this.client) {
      return;
    }

    this.client.capture({
      distinctId,
      event,
      properties,
    });
  }

<<<<<<< HEAD
  identify(
    distinctId: string,
    properties?: Record<string, unknown>,
  ): void {
=======
  identify(distinctId: string, properties?: Record<string, unknown>): void {
>>>>>>> master
    if (!this.client) {
      return;
    }

    this.client.identify({
      distinctId,
      properties,
    });
  }

  alias(distinctId: string, alias: string): void {
    if (!this.client) {
      return;
    }

    this.client.alias({
      distinctId,
      alias,
    });
  }

  groupIdentify(
    groupType: string,
    groupKey: string,
    properties?: Record<string, unknown>,
  ): void {
    if (!this.client) {
      return;
    }

    this.client.groupIdentify({
      groupType,
      groupKey,
      properties,
    });
  }

  async getFeatureFlag(
    key: string,
    distinctId: string,
    options?: {
      groups?: Record<string, string>;
      personProperties?: Record<string, string>;
      groupProperties?: Record<string, Record<string, string>>;
    },
  ): Promise<string | boolean | undefined> {
    if (!this.client) {
      return undefined;
    }

    return this.client.getFeatureFlag(key, distinctId, options);
  }

  async isFeatureEnabled(
    key: string,
    distinctId: string,
    options?: {
      groups?: Record<string, string>;
      personProperties?: Record<string, string>;
      groupProperties?: Record<string, Record<string, string>>;
    },
  ): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    const result = await this.client.isFeatureEnabled(key, distinctId, options);
    return result ?? false;
  }

  async flush(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.flush();
  }
}
