import type Stripe from 'stripe';

type InvoiceWithParent = Stripe.Invoice & {
  parent?: {
    subscription_details?: {
      subscription?: string | { id: string } | null;
      metadata?: Stripe.Metadata | null;
    } | null;
  } | null;
};

/**
 * Webhook payloads follow the webhook endpoint's API version, not the SDK's.
 * Since Stripe API 2025-03-31 an invoice no longer has `subscription`: the
 * link lives in `parent.subscription_details` (subscription id + a snapshot
 * of the subscription metadata). Reads both shapes.
 */
export function invoiceSubscription(invoice: Stripe.Invoice): {
  stripeSubscriptionId?: string;
  metadata?: Stripe.Metadata;
} {
  const details = (invoice as InvoiceWithParent).parent?.subscription_details;
  const legacyId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;
  const parentId =
    typeof details?.subscription === 'string'
      ? details.subscription
      : details?.subscription?.id;

  return {
    stripeSubscriptionId: legacyId ?? parentId ?? undefined,
    metadata:
      details?.metadata ?? invoice.subscription_details?.metadata ?? undefined,
  };
}
