import { z } from "zod";

export const queueNames = {
  grantAccess: "grant-access",
  revokeAccess: "revoke-access",
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

export const PaymentProvider = z.enum(["stripe", "paypal"]);

export const AccessChannelType = z.enum(["telegram", "discord"]);

export const SubscriptionStatus = z.enum([
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "trialing",
  "expired",
]);

export const GrantAccessPayload = z.object({
  subscriptionId: z.string().uuid(),
  channelId: z.string().uuid(),
  customerId: z.string().uuid(),
  provider: PaymentProvider,
});

export type PaymentProvider = z.infer<typeof PaymentProvider>;
export type AccessChannelType = z.infer<typeof AccessChannelType>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;
export type GrantAccessPayload = z.infer<typeof GrantAccessPayload>;

export const RevokeAccessPayload = z.object({
  subscriptionId: z.string().uuid(),
  reason: z.enum(["payment_failed", "canceled", "manual", "refund"]),
});

export type RevokeAccessPayload = z.infer<typeof RevokeAccessPayload>;
