import { z } from 'zod';
export declare const createPaymentEventSchema: z.ZodObject<{
    organizationId: z.ZodString;
    subscriptionId: z.ZodOptional<z.ZodString>;
    provider: z.ZodNativeEnum<{
        STRIPE: "STRIPE";
        PAYPAL: "PAYPAL";
    }>;
    type: z.ZodNativeEnum<{
        CHECKOUT_COMPLETED: "CHECKOUT_COMPLETED";
        SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED";
        SUBSCRIPTION_UPDATED: "SUBSCRIPTION_UPDATED";
        SUBSCRIPTION_CANCELED: "SUBSCRIPTION_CANCELED";
        INVOICE_PAID: "INVOICE_PAID";
        INVOICE_PAYMENT_FAILED: "INVOICE_PAYMENT_FAILED";
        REFUND_CREATED: "REFUND_CREATED";
    }>;
    externalId: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    occurredAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    provider: "STRIPE" | "PAYPAL";
    type: "CHECKOUT_COMPLETED" | "SUBSCRIPTION_CREATED" | "SUBSCRIPTION_UPDATED" | "SUBSCRIPTION_CANCELED" | "INVOICE_PAID" | "INVOICE_PAYMENT_FAILED" | "REFUND_CREATED";
    externalId: string;
    payload: Record<string, any>;
    subscriptionId?: string | undefined;
    occurredAt?: Date | undefined;
}, {
    organizationId: string;
    provider: "STRIPE" | "PAYPAL";
    type: "CHECKOUT_COMPLETED" | "SUBSCRIPTION_CREATED" | "SUBSCRIPTION_UPDATED" | "SUBSCRIPTION_CANCELED" | "INVOICE_PAID" | "INVOICE_PAYMENT_FAILED" | "REFUND_CREATED";
    externalId: string;
    payload: Record<string, any>;
    subscriptionId?: string | undefined;
    occurredAt?: Date | undefined;
}>;
export type CreatePaymentEventDto = z.infer<typeof createPaymentEventSchema>;
