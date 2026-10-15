import { $Enums } from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";

type ChannelAccessReader = Pick<PrismaClient, "channelAccess">;

/**
 * Whether a member still holds access to the channel through another
 * subscription (e.g. re-subscribed before the old one ended). Such a member
 * must not be kicked when the old subscription is revoked.
 *
 * A Telegram member is matched on the customer's Telegram ID and on the
 * accounts that joined with a paid invite link; a Discord member on the
 * customer's Discord ID. PAST_DUE subscriptions still count: their access
 * is kept during the grace period.
 */
export async function hasOtherActiveAccess(
  db: ChannelAccessReader,
  params: {
    channelId: string;
    subscriptionId: string;
    telegramUserId?: string | null;
    discordUserId?: string | null;
  }
): Promise<boolean> {
  const sameMember: Prisma.ChannelAccessWhereInput[] = [];
  if (params.telegramUserId) {
    sameMember.push(
      { customer: { telegramUserId: params.telegramUserId } },
      {
        metadata: {
          path: ["joinedTelegramUserIds"],
          array_contains: [params.telegramUserId],
        },
      }
    );
  }
  if (params.discordUserId) {
    sameMember.push({ customer: { discordUserId: params.discordUserId } });
  }
  if (sameMember.length === 0) {
    return false;
  }

  const other = await db.channelAccess.findFirst({
    where: {
      channelId: params.channelId,
      subscriptionId: { not: params.subscriptionId },
      status: {
        in: [
          $Enums.AccessStatus.PENDING,
          $Enums.AccessStatus.GRANTED,
          $Enums.AccessStatus.REVOKE_PENDING,
        ],
      },
      subscription: {
        status: {
          in: [
            $Enums.SubscriptionStatus.ACTIVE,
            $Enums.SubscriptionStatus.TRIALING,
            $Enums.SubscriptionStatus.PAST_DUE,
          ],
        },
      },
      OR: sameMember,
    },
    select: { id: true },
  });

  return other !== null;
}
