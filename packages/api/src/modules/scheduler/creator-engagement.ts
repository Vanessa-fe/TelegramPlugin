import type { Logger } from '@nestjs/common';
import {
  getBrevoListEmails,
  removeBrevoContactsFromList,
  upsertBrevoContact,
} from '../../common/brevo-sync';
import type { CreatorListItem } from '../admin-dashboard/admin-dashboard.service';

/** Days without logging in after which a creator joins the Brevo inactive list */
export const INACTIVE_AFTER_DAYS = 30;

/**
 * Brevo attribute ETAPE: the first thing keeping a creator from earning
 * money, in the order they have to fix it. Brevo workflows pick the
 * re-engagement email from it.
 */
export type CreatorStage =
  | 'suspendu' // blocked for an unpaid Sublynk plan: list #7 emails handle it
  | 'sans_plan' // never picked a Sublynk plan
  | 'plan_inactif' // Sublynk plan canceled, expired or never paid
  | 'canal' // no channel connected
  | 'stripe' // Stripe not connected, or not able to take payments yet
  | 'offre' // nothing a buyer can pay for (see readyOffersWhere)
  | 'promo' // ready to sell, never sold
  | 'en_pause' // sold before, nothing in the last 30 days
  | 'actif'; // sold in the last 30 days

export type EngagementCreator = Pick<
  CreatorListItem,
  | 'id'
  | 'billingEmail'
  | 'suspendedAt'
  | 'platformStatus'
  | 'sellingBlockers'
  | 'channelsCount'
  | 'salesCount'
  | 'healthScore'
>;

export function creatorStage(
  creator: EngagementCreator,
  hasReadyOffer: boolean,
): CreatorStage {
  const blockers = creator.sellingBlockers;
  if (creator.suspendedAt) return 'suspendu';
  if (!creator.platformStatus) return 'sans_plan';
  if (blockers.includes('PLATFORM_PLAN')) return 'plan_inactif';
  if (creator.channelsCount === 0) return 'canal';
  if (
    blockers.includes('STRIPE_NOT_CONNECTED') ||
    blockers.includes('STRIPE_INCOMPLETE')
  ) {
    return 'stripe';
  }
  if (!hasReadyOffer) return 'offre';
  if (creator.salesCount === 0) return 'promo';
  if (creator.healthScore.recentSalesCount === 0) return 'en_pause';
  return 'actif';
}

/** Emails from a comma-, semicolon- or space-separated setting, lowercased. */
export function parseEmailList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** A Brevo list id from a setting, or null when unset or not a positive integer. */
export function parseListId(value: string | undefined): number | null {
  const listId = Number(value?.trim());
  return Number.isInteger(listId) && listId > 0 ? listId : null;
}

export interface EngagementSyncOptions {
  creators: EngagementCreator[];
  /** Organizations with at least one offer a buyer can pay for right now */
  readyOrganizationIds: Set<string>;
  /** Brevo list of creators to re-engage; null syncs the attributes only */
  inactiveListId: number | null;
  /** Never sent to Brevo, and taken out of the inactive list (internal accounts) */
  excludedEmails: Set<string>;
  logger: Logger;
}

export interface EngagementSyncResult {
  synced: number;
  failed: number;
  addedToInactiveList: number;
  removedFromInactiveList: number;
  /** False when there is no list id or the list could not be read */
  inactiveListSynced: boolean;
}

/**
 * Send each creator's ETAPE, DERNIERE_CONNEXION and NB_VENTES to Brevo, and
 * keep the inactive list to creators who haven't logged in for
 * INACTIVE_AFTER_DAYS days and aren't earning, so that entering the list can
 * trigger a re-engagement workflow. A creator who comes back leaves the list,
 * and joins it again (re-triggering the workflow) after another inactive spell.
 *
 * Creators who never logged in are left out: their email address was never
 * verified. A Brevo failure on one creator doesn't stop the others.
 */
export async function syncCreatorEngagementToBrevo({
  creators,
  readyOrganizationIds,
  inactiveListId,
  excludedEmails,
  logger,
}: EngagementSyncOptions): Promise<EngagementSyncResult> {
  const result: EngagementSyncResult = {
    synced: 0,
    failed: 0,
    addedToInactiveList: 0,
    removedFromInactiveList: 0,
    inactiveListSynced: false,
  };

  // Read the list first: only add contacts not in it yet, so a daily run
  // never looks like a new entry to Brevo, and only remove actual members.
  let listMembers: Set<string> | null = null;
  if (inactiveListId) {
    try {
      listMembers = await getBrevoListEmails(inactiveListId);
      result.inactiveListSynced = true;
    } catch (error) {
      logger.error(
        `Could not read Brevo list ${inactiveListId}, leaving it unchanged: ${(error as Error).message}`,
      );
    }
  }

  const creatorEmails = new Set<string>();
  const inactiveEmails = new Set<string>();

  for (const creator of creators) {
    const email = creator.billingEmail.trim().toLowerCase();
    creatorEmails.add(email);

    const { lastLoginAt, daysSinceLogin } = creator.healthScore;
    if (excludedEmails.has(email) || !lastLoginAt) {
      continue;
    }

    const stage = creatorStage(creator, readyOrganizationIds.has(creator.id));
    const inactive =
      daysSinceLogin !== null &&
      daysSinceLogin >= INACTIVE_AFTER_DAYS &&
      stage !== 'actif' &&
      stage !== 'suspendu';
    if (inactive) {
      inactiveEmails.add(email);
    }
    const addToList =
      inactive && inactiveListId !== null && listMembers?.has(email) === false;

    try {
      await upsertBrevoContact(email, {
        attributes: {
          ETAPE: stage,
          DERNIERE_CONNEXION: lastLoginAt.toISOString().slice(0, 10),
          NB_VENTES: creator.salesCount,
        },
        listIds: addToList ? [inactiveListId] : undefined,
      });
      result.synced++;
      if (addToList) {
        listMembers?.add(email);
        result.addedToInactiveList++;
      }
    } catch (error) {
      result.failed++;
      logger.error(
        `Failed to sync engagement to Brevo for org ${creator.id}: ${(error as Error).message}`,
      );
    }
  }

  if (inactiveListId && listMembers) {
    // Contacts added to the list by hand in Brevo are left alone
    const toRemove = [...listMembers].filter(
      (email) => creatorEmails.has(email) && !inactiveEmails.has(email),
    );
    if (toRemove.length > 0) {
      try {
        await removeBrevoContactsFromList(inactiveListId, toRemove);
        result.removedFromInactiveList = toRemove.length;
      } catch (error) {
        result.inactiveListSynced = false;
        logger.error(
          `Failed to remove returning creators from Brevo list ${inactiveListId}: ${(error as Error).message}`,
        );
      }
    }
  }

  return result;
}
