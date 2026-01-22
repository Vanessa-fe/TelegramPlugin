import { z } from "zod";
export const queueNames = {
    grantAccess: "grant-access",
    revokeAccess: "revoke-access",
};
export const PaymentProvider = z.enum(["stripe", "paypal", "telegram_stars"]);
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
export const RevokeAccessPayload = z.object({
    subscriptionId: z.string().uuid(),
    reason: z.enum(["payment_failed", "canceled", "manual", "refund", "expired"]),
});
//# sourceMappingURL=index.js.map