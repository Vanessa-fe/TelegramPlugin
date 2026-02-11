import { Queue, Worker, type Job } from "bullmq";
import { Bot, GrammyError, HttpError } from "grammy";
import { Client, GatewayIntentBits } from "discord.js";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { $Enums, PrismaClient } from "@prisma/client";
import {
  GrantAccessPayload as GrantAccessPayloadSchema,
  RevokeAccessPayload as RevokeAccessPayloadSchema,
  computeJobLatencyMs,
  queueNames,
} from "@telegram-plugin/shared";
import type {
  GrantAccessPayload,
  RevokeAccessPayload,
} from "@telegram-plugin/shared";
import { env as processEnv, argv } from "node:process";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const logger = pino({
  name: "worker",
  level: processEnv.LOG_LEVEL ?? "info",
});

const DEFAULT_ACCESS_LATENCY_ALERT_MS = 2000;

const BaseEnvSchema = z.object({
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN requis"),
  DISCORD_BOT_TOKEN: z.string().optional(),
  TELEGRAM_INVITE_TTL_SECONDS: z.string().optional(),
  TELEGRAM_INVITE_MAX_USES: z.string().optional(),
  ACCESS_LATENCY_ALERT_MS: z.string().optional(),
});

type BaseEnv = z.infer<typeof BaseEnvSchema>;

type WorkerEnv = Omit<
  BaseEnv,
  "TELEGRAM_INVITE_TTL_SECONDS" | "TELEGRAM_INVITE_MAX_USES" | "ACCESS_LATENCY_ALERT_MS"
> & {
  TELEGRAM_INVITE_TTL_SECONDS?: number;
  TELEGRAM_INVITE_MAX_USES?: number;
  ACCESS_LATENCY_ALERT_MS: number;
};

function parseOptionalInteger(
  value: string | undefined,
  {
    varName,
    min,
    max,
  }: {
    varName: string;
    min: number;
    max: number;
  }
): number | undefined {
  if (!value || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`${varName} must be an integer value`);
  }

  if (parsed < min || parsed > max) {
    throw new Error(`${varName} must be between ${min} and ${max}`);
  }

  return parsed;
}

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.resolve(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = path.resolve(dir, "..");
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

function resolveEnvFile(): string | undefined {
  const explicit = processEnv.ENV_FILE?.trim();
  if (explicit) {
    return path.isAbsolute(explicit)
      ? explicit
      : path.resolve(findRepoRoot(process.cwd()), explicit);
  }

  const cwd = process.cwd();
  const repoRoot = findRepoRoot(cwd);
  const isProduction = processEnv.NODE_ENV === "production";
  const preferredName = isProduction ? ".env.production" : ".env.local";
  const candidates = [
    path.resolve(cwd, preferredName),
    path.resolve(repoRoot, preferredName),
    path.resolve(cwd, ".env"),
    path.resolve(repoRoot, ".env"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

const envFile = resolveEnvFile();
if (envFile) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const baseEnv = BaseEnvSchema.parse(processEnv);

const env: WorkerEnv = {
  ...baseEnv,
  TELEGRAM_INVITE_TTL_SECONDS: parseOptionalInteger(
    baseEnv.TELEGRAM_INVITE_TTL_SECONDS,
    {
      varName: "TELEGRAM_INVITE_TTL_SECONDS",
      min: 60,
      max: 60 * 60 * 24 * 7,
    }
  ),
  TELEGRAM_INVITE_MAX_USES: parseOptionalInteger(
    baseEnv.TELEGRAM_INVITE_MAX_USES,
    {
      varName: "TELEGRAM_INVITE_MAX_USES",
      min: 1,
      max: 100_000,
    }
  ),
  ACCESS_LATENCY_ALERT_MS:
    parseOptionalInteger(baseEnv.ACCESS_LATENCY_ALERT_MS, {
      varName: "ACCESS_LATENCY_ALERT_MS",
      min: 100,
      max: 60 * 60 * 1000,
    }) ?? DEFAULT_ACCESS_LATENCY_ALERT_MS,
};

let connection: Redis;
const prisma = new PrismaClient();
const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// Discord client (optional, only initialized if token is provided)
let discordClient: Client | null = null;
if (env.DISCORD_BOT_TOKEN) {
  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
  });
}

const workers: Worker[] = [];
let grantDlq: Queue | null = null;
let revokeDlq: Queue | null = null;
let isShuttingDown = false;

async function initRedis(): Promise<Redis> {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  return new Promise((resolve, reject) => {
    redis.on("ready", () => {
      logger.info("Redis connection established");
      resolve(redis);
    });
    redis.on("error", (err) => {
      logger.error({ error: err }, "Redis connection error");
      reject(err);
    });
  });
}

function extractInviteHash(inviteLink: string): string | null {
  const url = inviteLink.trim();
  if (!url) {
    return null;
  }

  const lastPart = url.split("/").pop();
  if (!lastPart) {
    return null;
  }

  return lastPart.startsWith("+") ? lastPart.slice(1) : lastPart;
}

async function revokeExistingInviteLink(
  chatId: string,
  inviteLink: string
): Promise<void> {
  try {
    await bot.api.revokeChatInviteLink(chatId, inviteLink);
  } catch (error) {
    if (
      error instanceof GrammyError &&
      (error.error_code === 400 ||
        error.description.includes("CHAT_ADMIN_REQUIRED"))
    ) {
      logger.warn(
        {
          chatId,
          inviteLink,
          description: error.description,
        },
        "Failed to revoke existing invite link on Telegram, continuing"
      );
      return;
    }

    if (error instanceof HttpError) {
      logger.error(
        { chatId, inviteLink, error: error.error },
        "Network error while revoking invite link"
      );
      throw error;
    }

    throw error;
  }
}

async function processGrantAccess(job: Job<GrantAccessPayload>): Promise<void> {
  const data = GrantAccessPayloadSchema.parse(job.data);

  const channelAccess = await prisma.channelAccess.findUnique({
    where: {
      subscriptionId_channelId: {
        subscriptionId: data.subscriptionId,
        channelId: data.channelId,
      },
    },
    include: {
      channel: {
        include: {
          discordGuild: true,
        },
      },
      invite: true,
      customer: true,
    },
  });

  if (!channelAccess) {
    logger.warn(
      {
        jobId: job.id,
        subscriptionId: data.subscriptionId,
        channelId: data.channelId,
      },
      "Channel access not found, skipping grant job"
    );
    return;
  }

  // Route to appropriate handler based on provider
  if (channelAccess.channel.provider === $Enums.ChannelProvider.DISCORD) {
    await processDiscordGrant(job, channelAccess);
    return;
  }

  if (channelAccess.channel.provider === $Enums.ChannelProvider.WHATSAPP) {
    logger.info(
      {
        jobId: job.id,
        subscriptionId: data.subscriptionId,
        channelId: data.channelId,
      },
      "WhatsApp access requires manual confirmation, skipping grant job"
    );
    return;
  }

  if (channelAccess.channel.provider !== $Enums.ChannelProvider.TELEGRAM) {
    logger.warn(
      {
        jobId: job.id,
        subscriptionId: data.subscriptionId,
        channelId: data.channelId,
        provider: channelAccess.channel.provider,
      },
      "Unknown channel provider, skipping grant job"
    );
    return;
  }

  const chatId = channelAccess.channel.externalId;

  if (!chatId) {
    throw new Error(
      `Missing externalId for channel ${channelAccess.channelId}, cannot grant access`
    );
  }

  if (
    channelAccess.invite?.inviteLink &&
    channelAccess.invite.status === $Enums.InviteStatus.ACTIVE
  ) {
    await revokeExistingInviteLink(chatId, channelAccess.invite.inviteLink);
  }

  const now = new Date();
  const inviteOptions: Parameters<
    (typeof bot.api)["createChatInviteLink"]
  >[1] = {};
  const nowUnix = Math.floor(Date.now() / 1000);

  if (env.TELEGRAM_INVITE_TTL_SECONDS) {
    inviteOptions.expire_date = nowUnix + env.TELEGRAM_INVITE_TTL_SECONDS;
  }

  if (env.TELEGRAM_INVITE_MAX_USES) {
    inviteOptions.member_limit = env.TELEGRAM_INVITE_MAX_USES;
  }

  try {
    const invite = await bot.api.createChatInviteLink(chatId, inviteOptions);
    const inviteHash = extractInviteHash(invite.invite_link);

    await prisma.$transaction(async (tx) => {
      if (channelAccess.inviteId) {
        await tx.telegramInvite.update({
          where: { id: channelAccess.inviteId },
          data: {
            status: $Enums.InviteStatus.EXPIRED,
            revokedAt: now,
            revokedReason: "superseded",
          },
        }).catch(() => undefined);
      }

      const createdInvite = await tx.telegramInvite.create({
        data: {
          channelId: channelAccess.channelId,
          inviteLink: invite.invite_link,
          inviteHash: inviteHash ?? undefined,
          status: $Enums.InviteStatus.ACTIVE,
          expiresAt: invite.expire_date
            ? new Date(invite.expire_date * 1000)
            : undefined,
          maxUses: invite.member_limit ?? undefined,
        },
      });

      await tx.channelAccess.update({
        where: { id: channelAccess.id },
        data: {
          status: $Enums.AccessStatus.GRANTED,
          grantedAt: now,
          inviteId: createdInvite.id,
          revokedAt: null,
          revokeReason: null,
        },
      });

      await tx.channel.update({
        where: { id: channelAccess.channelId },
        data: {
          inviteLink: invite.invite_link,
        },
      });
    });

    // Send notification with invite link to customer
    if (channelAccess.customer.telegramUserId) {
      const channelTitle = channelAccess.channel.title || "le channel";
      const message =
        `🎉 <b>Accès accordé !</b>\n\n` +
        `Votre accès à "${channelTitle}" a été activé.\n\n` +
        `👉 <a href="${invite.invite_link}">Rejoindre le channel</a>\n\n` +
        `<i>Ce lien est personnel et à usage unique.</i>`;

      const sent = await sendTelegramNotification(
        channelAccess.customer.telegramUserId,
        message
      );

      if (sent) {
        logger.info(
          {
            jobId: job.id,
            customerId: channelAccess.customerId,
            telegramUserId: channelAccess.customer.telegramUserId,
          },
          "Invite link notification sent to customer"
        );
      }
    }

    logger.info(
      {
        jobId: job.id,
        subscriptionId: data.subscriptionId,
        channelId: data.channelId,
      },
      "Telegram invite generated and channel access granted"
    );
  } catch (error) {
    if (error instanceof GrammyError) {
      logger.error(
        {
          jobId: job.id,
          subscriptionId: data.subscriptionId,
          channelId: data.channelId,
          description: error.description,
        },
        "Telegram API error while creating invite link"
      );
    } else if (error instanceof HttpError) {
      logger.error(
        {
          jobId: job.id,
          subscriptionId: data.subscriptionId,
          channelId: data.channelId,
          error: error.error,
        },
        "Network error while contacting Telegram API"
      );
    } else {
      logger.error(
        {
          jobId: job.id,
          subscriptionId: data.subscriptionId,
          channelId: data.channelId,
        },
        "Unexpected error while granting channel access"
      );
    }

    throw error;
  }
}

async function kickMemberFromChannel(
  chatId: string,
  telegramUserId: string
): Promise<boolean> {
  try {
    // Ban the user (this kicks them from the channel)
    await bot.api.banChatMember(chatId, Number(telegramUserId));
    // Immediately unban to allow them to rejoin if they purchase again
    await bot.api.unbanChatMember(chatId, Number(telegramUserId), {
      only_if_banned: true,
    });
    return true;
  } catch (error) {
    if (error instanceof GrammyError) {
      // User might not be in the channel or bot doesn't have permission
      if (
        error.error_code === 400 ||
        error.description.includes("USER_NOT_PARTICIPANT") ||
        error.description.includes("CHAT_ADMIN_REQUIRED")
      ) {
        logger.warn(
          { chatId, telegramUserId, description: error.description },
          "Could not kick member (might not be in channel or no permission)"
        );
        return false;
      }
    }
    throw error;
  }
}

async function sendTelegramNotification(
  telegramUserId: string,
  message: string
): Promise<boolean> {
  try {
    await bot.api.sendMessage(telegramUserId, message, {
      parse_mode: "HTML",
    });
    return true;
  } catch (error) {
    if (error instanceof GrammyError) {
      logger.warn(
        { telegramUserId, description: error.description },
        "Could not send Telegram notification"
      );
      return false;
    }
    throw error;
  }
}

// ========== Discord Functions ==========

async function grantDiscordRole(
  guildId: string,
  roleId: string,
  discordUserId: string
): Promise<boolean> {
  if (!discordClient) {
    logger.error("Discord client not initialized");
    return false;
  }

  try {
    const guild = await discordClient.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordUserId);
    const role = await guild.roles.fetch(roleId);

    if (!role) {
      logger.error({ guildId, roleId }, "Discord role not found");
      return false;
    }

    await member.roles.add(role, "Paid access granted via monetization platform");
    logger.info(
      { guildId, roleId, discordUserId },
      "Discord role granted to member"
    );
    return true;
  } catch (error) {
    logger.error(
      {
        guildId,
        roleId,
        discordUserId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to grant Discord role"
    );
    return false;
  }
}

async function revokeDiscordRole(
  guildId: string,
  roleId: string,
  discordUserId: string
): Promise<boolean> {
  if (!discordClient) {
    logger.error("Discord client not initialized");
    return false;
  }

  try {
    const guild = await discordClient.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordUserId);
    const role = await guild.roles.fetch(roleId);

    if (!role) {
      logger.error({ guildId, roleId }, "Discord role not found");
      return false;
    }

    await member.roles.remove(role, "Access revoked via monetization platform");
    logger.info(
      { guildId, roleId, discordUserId },
      "Discord role revoked from member"
    );
    return true;
  } catch (error) {
    logger.error(
      {
        guildId,
        roleId,
        discordUserId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to revoke Discord role"
    );
    return false;
  }
}

async function sendDiscordNotification(
  discordUserId: string,
  message: string
): Promise<boolean> {
  if (!discordClient) {
    return false;
  }

  try {
    const user = await discordClient.users.fetch(discordUserId);
    await user.send(message);
    logger.info({ discordUserId }, "Discord DM sent");
    return true;
  } catch (error) {
    logger.warn(
      {
        discordUserId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Could not send Discord DM"
    );
    return false;
  }
}

// ========== Discord Grant/Revoke Processing ==========

type ChannelAccessWithDiscord = Awaited<ReturnType<typeof prisma.channelAccess.findUnique>> & {
  channel: {
    id: string;
    provider: $Enums.ChannelProvider;
    externalId: string;
    title: string | null;
    discordGuild: {
      guildId: string;
      roleId: string | null;
      roleName: string | null;
    } | null;
  };
  customer: {
    id: string;
    discordUserId: string | null;
    telegramUserId: string | null;
  };
};

async function processDiscordGrant(
  job: Job<GrantAccessPayload>,
  channelAccess: NonNullable<ChannelAccessWithDiscord>
): Promise<void> {
  const discordGuild = channelAccess.channel.discordGuild;

  if (!discordGuild) {
    throw new Error(
      `Missing Discord guild info for channel ${channelAccess.channelId}`
    );
  }

  if (!discordGuild.roleId) {
    throw new Error(
      `Missing Discord role ID for channel ${channelAccess.channelId}`
    );
  }

  const discordUserId = channelAccess.customer.discordUserId;

  if (!discordUserId) {
    logger.warn(
      {
        jobId: job.id,
        customerId: channelAccess.customerId,
      },
      "Customer has no Discord user ID linked, cannot grant Discord access"
    );
    // Don't throw - just mark as pending, waiting for customer to link Discord
    return;
  }

  const now = new Date();
  const granted = await grantDiscordRole(
    discordGuild.guildId,
    discordGuild.roleId,
    discordUserId
  );

  if (!granted) {
    throw new Error(
      `Failed to grant Discord role for channel ${channelAccess.channelId}`
    );
  }

  // Update channel access status
  await prisma.channelAccess.update({
    where: { id: channelAccess.id },
    data: {
      status: $Enums.AccessStatus.GRANTED,
      grantedAt: now,
      discordRoleId: discordGuild.roleId,
      revokedAt: null,
      revokeReason: null,
    },
  });

  // Send Discord notification
  const serverName = channelAccess.channel.title || "le serveur";
  const roleName = discordGuild.roleName || "le rôle";
  const message =
    `🎉 **Accès accordé !**\n\n` +
    `Votre accès à "${serverName}" a été activé.\n\n` +
    `Le rôle "${roleName}" vous a été attribué.\n\n` +
    `_Vous pouvez maintenant accéder au contenu réservé aux membres._`;

  const sent = await sendDiscordNotification(discordUserId, message);

  if (sent) {
    logger.info(
      {
        jobId: job.id,
        customerId: channelAccess.customerId,
        discordUserId,
      },
      "Discord access notification sent to customer"
    );
  }

  logger.info(
    {
      jobId: job.id,
      subscriptionId: channelAccess.subscriptionId,
      channelId: channelAccess.channelId,
      guildId: discordGuild.guildId,
      roleId: discordGuild.roleId,
    },
    "Discord role granted and channel access updated"
  );
}

async function processDiscordRevoke(
  job: Job<RevokeAccessPayload>,
  access: NonNullable<ChannelAccessWithDiscord>,
  reason: string
): Promise<void> {
  const discordGuild = access.channel.discordGuild;

  if (!discordGuild) {
    logger.error(
      {
        jobId: job.id,
        channelId: access.channelId,
      },
      "Cannot revoke Discord access: missing guild info"
    );
    return;
  }

  const roleId = access.discordRoleId || discordGuild.roleId;

  if (!roleId) {
    logger.error(
      {
        jobId: job.id,
        channelId: access.channelId,
      },
      "Cannot revoke Discord access: missing role ID"
    );
    return;
  }

  const discordUserId = access.customer.discordUserId;

  if (!discordUserId) {
    logger.warn(
      {
        jobId: job.id,
        customerId: access.customerId,
      },
      "Customer has no Discord user ID, skipping Discord revoke"
    );
    return;
  }

  const now = new Date();

  // Revoke the role
  await revokeDiscordRole(discordGuild.guildId, roleId, discordUserId);

  // Update access status
  await prisma.channelAccess.update({
    where: { id: access.id },
    data: {
      status: $Enums.AccessStatus.REVOKED,
      revokedAt: now,
      revokeReason: reason,
    },
  });

  // Send Discord notification
  const reasonMessages: Record<string, string> = {
    payment_failed: "Échec du paiement",
    canceled: "Abonnement annulé",
    refund: "Remboursement effectué",
    expired: "Abonnement expiré",
    manual: "Révocation manuelle",
  };
  const serverName = access.channel.title || "le serveur";
  const message =
    `🚫 **Accès révoqué**\n\n` +
    `Votre accès à "${serverName}" a été révoqué.\n\n` +
    `Raison : ${reasonMessages[reason] || reason}`;

  await sendDiscordNotification(discordUserId, message);

  logger.info(
    {
      jobId: job.id,
      channelId: access.channelId,
      guildId: discordGuild.guildId,
      roleId,
      discordUserId,
    },
    "Discord access revoked"
  );
}

async function processRevokeAccess(
  job: Job<RevokeAccessPayload>
): Promise<void> {
  const data = RevokeAccessPayloadSchema.parse(job.data);
  const channelAccesses = await prisma.channelAccess.findMany({
    where: { subscriptionId: data.subscriptionId },
    include: {
      channel: {
        include: {
          discordGuild: true,
        },
      },
      invite: true,
      customer: true,
    },
  });

  if (channelAccesses.length === 0) {
    logger.warn(
      {
        jobId: job.id,
        subscriptionId: data.subscriptionId,
      },
      "No channel access found to revoke"
    );
    return;
  }

  const now = new Date();

  for (const access of channelAccesses) {
    // Handle Discord channels
    if (access.channel.provider === $Enums.ChannelProvider.DISCORD) {
      await processDiscordRevoke(job, access as ChannelAccessWithDiscord, data.reason);
      continue;
    }

    if (access.channel.provider === $Enums.ChannelProvider.WHATSAPP) {
      logger.info(
        {
          jobId: job.id,
          channelId: access.channelId,
          subscriptionId: data.subscriptionId,
        },
        "WhatsApp access requires manual confirmation, skipping revoke job"
      );
      continue;
    }

    // Handle non-Telegram channels
    if (access.channel.provider !== $Enums.ChannelProvider.TELEGRAM) {
      continue;
    }

    const chatId = access.channel.externalId;

    if (!chatId) {
      logger.error(
        {
          jobId: job.id,
          channelId: access.channelId,
        },
        "Cannot revoke access: missing channel externalId"
      );
      continue;
    }

    if (
      access.invite?.inviteLink &&
      access.invite.status === $Enums.InviteStatus.ACTIVE
    ) {
      try {
        await bot.api.revokeChatInviteLink(chatId, access.invite.inviteLink);
      } catch (error) {
        if (error instanceof GrammyError && error.error_code === 400) {
          logger.warn(
            {
              jobId: job.id,
              channelId: access.channelId,
              description: error.description,
            },
            "Invite already invalid on Telegram"
          );
        } else if (error instanceof HttpError) {
          logger.error(
            {
              jobId: job.id,
              channelId: access.channelId,
              error: error.error,
            },
            "Network error while revoking invite link"
          );
          throw error;
        } else {
          throw error;
        }
      }
    }

    // Kick member from channel if they have a Telegram user ID
    if (access.customer.telegramUserId) {
      const kicked = await kickMemberFromChannel(
        chatId,
        access.customer.telegramUserId
      );
      if (kicked) {
        logger.info(
          {
            jobId: job.id,
            channelId: access.channelId,
            telegramUserId: access.customer.telegramUserId,
          },
          "Member kicked from channel"
        );
      }

      // Send notification about access revocation
      const reasonMessages: Record<string, string> = {
        payment_failed: "Échec du paiement",
        canceled: "Abonnement annulé",
        refund: "Remboursement effectué",
      };
      const channelTitle = access.channel.title || "le channel";
      const message =
        `🚫 <b>Accès révoqué</b>\n\n` +
        `Votre accès à "${channelTitle}" a été révoqué.\n\n` +
        `Raison : ${reasonMessages[data.reason] || data.reason}`;

      await sendTelegramNotification(access.customer.telegramUserId, message);
    }

    await prisma.$transaction(async (tx) => {
      await tx.channelAccess.update({
        where: { id: access.id },
        data: {
          status: $Enums.AccessStatus.REVOKED,
          revokedAt: now,
          revokeReason: data.reason,
        },
      });

      if (access.inviteId) {
        await tx.telegramInvite.update({
          where: { id: access.inviteId },
          data: {
            status: $Enums.InviteStatus.REVOKED,
            revokedAt: now,
            revokedReason: data.reason,
          },
        }).catch(() => undefined);
      }

      await tx.channel.update({
        where: { id: access.channelId },
        data: {
          inviteLink: null,
        },
      });
    });
  }

  logger.info(
    {
      jobId: job.id,
      subscriptionId: data.subscriptionId,
      revokedCount: channelAccesses.length,
    },
    "Channel accesses revoked"
  );
}

async function shutdown(signal?: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info({ signal }, "Shutting down workers");

  await Promise.allSettled([
    ...workers.map((worker) => worker.close()),
    grantDlq?.close(),
    revokeDlq?.close(),
  ]);

  // Destroy Discord client if initialized
  if (discordClient) {
    discordClient.destroy();
    logger.info("Discord client destroyed");
  }

  await prisma.$disconnect().catch((error: unknown) => {
    logger.error({ error: error as Error }, "Failed to disconnect Prisma client");
  });

  await connection.quit().catch((error: unknown) => {
    logger.error({ error: error as Error }, "Failed to close Redis connection");
  });

  logger.info("Worker shutdown complete");
}

async function moveToDlq<T>(
  job: Job<T> | undefined,
  error: Error,
  dlq: Queue | null,
  queueName: string
): Promise<void> {
  if (!job || !dlq) {
    return;
  }

  const attempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < attempts) {
    return;
  }

  const jobId = job.id ? String(job.id) : `${queueName}:${Date.now()}`;

  await dlq.add(
    queueName,
    {
      originalJobId: jobId,
      payload: job.data,
      failedReason: error.message,
      attemptsMade: job.attemptsMade,
      stacktrace: job.stacktrace,
      failedAt: new Date().toISOString(),
    },
    {
      jobId,
    }
  );

  await job.remove().catch((removeError: unknown) => {
    logger.error(
      { error: removeError as Error, jobId, queue: queueName },
      "Failed to remove job after moving to DLQ"
    );
  });
}

export async function bootstrapWorkers(): Promise<void> {
  // Initialize Redis connection first
  connection = await initRedis();
  grantDlq = new Queue(queueNames.grantAccessDlq, { connection });
  revokeDlq = new Queue(queueNames.revokeAccessDlq, { connection });

  const me = await bot.api.getMe();
  logger.info(
    {
      botId: me.id,
      username: me.username,
    },
    "Telegram API client initialised"
  );

  // Initialize Discord client if token is provided
  if (discordClient) {
    await discordClient.login(env.DISCORD_BOT_TOKEN);
    logger.info(
      {
        username: discordClient.user?.tag,
      },
      "Discord client initialised"
    );
  } else {
    logger.info("Discord client not configured (DISCORD_BOT_TOKEN not set)");
  }

  const grantWorker = new Worker<GrantAccessPayload>(
    queueNames.grantAccess,
    processGrantAccess,
    {
      connection,
      concurrency: 4,
    }
  );
  const revokeWorker = new Worker<RevokeAccessPayload>(
    queueNames.revokeAccess,
    processRevokeAccess,
    {
      connection,
      concurrency: 2,
    }
  );

  workers.push(grantWorker, revokeWorker);

  await Promise.all(workers.map((worker) => worker.waitUntilReady()));

  grantWorker.on("completed", (job) => {
    const latencyMs = computeJobLatencyMs(job.timestamp, job.finishedOn);
    const payload = {
      jobId: job.id,
      queue: queueNames.grantAccess,
      latencyMs,
      metric: "access_grant_latency_ms",
    };

    logger.info(
      payload,
      "Grant access job completed"
    );

    if (latencyMs !== null && latencyMs > env.ACCESS_LATENCY_ALERT_MS) {
      logger.warn(
        payload,
        "Grant access latency threshold exceeded"
      );
    }
  });

  grantWorker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, queue: queueNames.grantAccess, error: error as Error },
      "Grant access job failed"
    );
    moveToDlq(job, error as Error, grantDlq, queueNames.grantAccessDlq).catch(
      (dlqError: unknown) => {
        logger.error(
          {
            error: dlqError as Error,
            jobId: job?.id,
            queue: queueNames.grantAccessDlq,
          },
          "Failed to move grant access job to DLQ"
        );
      }
    );
  });

  revokeWorker.on("completed", (job) => {
    const latencyMs = computeJobLatencyMs(job.timestamp, job.finishedOn);
    const payload = {
      jobId: job.id,
      queue: queueNames.revokeAccess,
      latencyMs,
      metric: "access_revoke_latency_ms",
    };

    logger.info(
      payload,
      "Revoke access job completed"
    );

    if (latencyMs !== null && latencyMs > env.ACCESS_LATENCY_ALERT_MS) {
      logger.warn(
        payload,
        "Revoke access latency threshold exceeded"
      );
    }
  });

  revokeWorker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, queue: queueNames.revokeAccess, error: error as Error },
      "Revoke access job failed"
    );
    moveToDlq(job, error as Error, revokeDlq, queueNames.revokeAccessDlq).catch(
      (dlqError: unknown) => {
        logger.error(
          {
            error: dlqError as Error,
            jobId: job?.id,
            queue: queueNames.revokeAccessDlq,
          },
          "Failed to move revoke access job to DLQ"
        );
      }
    );
  });

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  signals.forEach((signal) => {
    process.once(signal, () => {
      shutdown(signal).catch((error: unknown) => {
        logger.error({ error: error as Error }, "Error during worker shutdown");
      });
    });
  });

  logger.info("Workers BullMQ démarrés");
}

const isExecutedDirectly =
  argv[1] && argv[1] === fileURLToPath(import.meta.url);

if (isExecutedDirectly) {
  bootstrapWorkers().catch((error: unknown) => {
    logger.error({ error: error as Error }, "Worker bootstrap failed");
    shutdown().finally(() => {
      process.exitCode = 1;
    });
  });
}
