import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export interface PostHogConfig {
  apiKey: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
}

export function initPostHog(config: PostHogConfig): PostHog {
  if (posthogClient) {
    return posthogClient;
  }

  posthogClient = new PostHog(config.apiKey, {
    host: config.host ?? "https://eu.i.posthog.com",
    flushAt: config.flushAt ?? 20,
    flushInterval: config.flushInterval ?? 10000,
  });

  return posthogClient;
}

export function getPostHog(): PostHog | null {
  return posthogClient;
}

export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}

// Server-side event names
export const ServerEvents = {
  // Auth events
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",

  // Subscription events
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  SUBSCRIPTION_EXPIRED: "subscription_expired",

  // Payment events
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  REFUND_ISSUED: "refund_issued",

  // Channel access events
  CHANNEL_ACCESS_GRANTED: "channel_access_granted",
  CHANNEL_ACCESS_REVOKED: "channel_access_revoked",

  // Product events
  PRODUCT_CREATED: "product_created",
  PLAN_CREATED: "plan_created",

  // Channel events
  CHANNEL_CONNECTED: "channel_connected",
  CHANNEL_DISCONNECTED: "channel_disconnected",
} as const;

export type ServerEvent = (typeof ServerEvents)[keyof typeof ServerEvents];
