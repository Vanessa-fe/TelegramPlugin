import { z } from "zod";
export declare const queueNames: {
    readonly grantAccess: "grant-access";
    readonly revokeAccess: "revoke-access";
    readonly grantAccessDlq: "grant-access-dlq";
    readonly revokeAccessDlq: "revoke-access-dlq";
};
export type QueueName = (typeof queueNames)[keyof typeof queueNames];
export declare const PaymentProvider: z.ZodEnum<["stripe", "paypal", "telegram_stars"]>;
export declare const AccessChannelType: z.ZodEnum<["telegram", "discord"]>;
export declare const SubscriptionStatus: z.ZodEnum<["active", "past_due", "canceled", "incomplete", "trialing", "expired"]>;
export declare const computeJobLatencyMs: (timestamp?: number | null, finishedOn?: number | null, now?: number) => number | null;
export declare const GrantAccessPayload: z.ZodObject<{
    subscriptionId: z.ZodString;
    channelId: z.ZodString;
    customerId: z.ZodString;
    provider: z.ZodEnum<["stripe", "paypal", "telegram_stars"]>;
}, "strip", z.ZodTypeAny, {
    subscriptionId: string;
    channelId: string;
    customerId: string;
    provider: "stripe" | "paypal" | "telegram_stars";
}, {
    subscriptionId: string;
    channelId: string;
    customerId: string;
    provider: "stripe" | "paypal" | "telegram_stars";
}>;
export type PaymentProvider = z.infer<typeof PaymentProvider>;
export type AccessChannelType = z.infer<typeof AccessChannelType>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;
export type GrantAccessPayload = z.infer<typeof GrantAccessPayload>;
export declare const RevokeAccessPayload: z.ZodObject<{
    subscriptionId: z.ZodString;
    reason: z.ZodEnum<["payment_failed", "canceled", "manual", "refund", "expired"]>;
}, "strip", z.ZodTypeAny, {
    subscriptionId: string;
    reason: "canceled" | "expired" | "payment_failed" | "manual" | "refund";
}, {
    subscriptionId: string;
    reason: "canceled" | "expired" | "payment_failed" | "manual" | "refund";
}>;
export type RevokeAccessPayload = z.infer<typeof RevokeAccessPayload>;
