import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  initPostHog,
  ServerEvents,
  shutdownPostHog,
} from '@telegram-plugin/shared';
import type { PostHog } from 'posthog-node';

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

    this.client = initPostHog({
      apiKey: projectToken,
      host: host ?? 'https://eu.i.posthog.com',
    });

    this.logger.log('PostHog initialized');
  }

  async onModuleDestroy() {
    await shutdownPostHog();
    this.client = null;
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

  identify(distinctId: string, properties?: Record<string, unknown>): void {
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
