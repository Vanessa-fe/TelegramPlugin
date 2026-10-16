import type { Logger } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import type { Prisma, PrismaClient } from '@prisma/client';
import { upsertBrevoContact } from './brevo-sync';

type OfferReadinessClient = Pick<PrismaClient, 'organization' | 'product'>;

/**
 * Offers a buyer can pay for right now, i.e. what the storefront needs to
 * show a checkout: an active offer with at least one active formule (plan)
 * and one active linked channel, sold by an organization whose Sublynk
 * subscription is active and whose Stripe account is connected.
 */
export function readyOffersWhere(
  organizationId: string,
): Prisma.ProductWhereInput {
  return {
    organizationId,
    status: ProductStatus.ACTIVE,
    plans: { some: { isActive: true } },
    channels: { some: { channel: { isActive: true } } },
    organization: { saasActive: true, stripeAccountId: { not: null } },
  };
}

/**
 * Brevo attribute OFFRE_PRETE: the creator has at least one offer a buyer
 * can pay for right now (see readyOffersWhere). Lets Brevo automations nudge
 * creators stuck before their first sale, so call it after anything that
 * changes one of those conditions. Never throws: a Brevo outage must not
 * block the action that triggered the sync.
 */
export async function syncOfferReadyToBrevo(
  prisma: OfferReadinessClient,
  organizationId: string,
  logger: Logger,
): Promise<void> {
  try {
    const [organization, readyOffers] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { billingEmail: true },
      }),
      prisma.product.count({ where: readyOffersWhere(organizationId) }),
    ]);
    if (!organization?.billingEmail) {
      return;
    }

    await upsertBrevoContact(organization.billingEmail, {
      attributes: { OFFRE_PRETE: readyOffers > 0 },
    });
  } catch (error) {
    logger.error(
      `Failed to sync OFFRE_PRETE to Brevo for org ${organizationId}`,
      error as Error,
    );
  }
}
