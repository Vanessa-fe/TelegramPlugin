import { Worker, type Job } from "bullmq";
import { Bot, GrammyError, HttpError } from "grammy";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { $Enums, PrismaClient } from "@prisma/client";
import {
  GrantAccessPayload as GrantAccessPayloadSchema,
  RevokeAccessPayload as RevokeAccessPayloadSchema,
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

const BaseEnvSchema = z.object({
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN requis"),
  TELEGRAM_INVITE_TTL_SECONDS: z.string().optional(),
  TELEGRAM_INVITE_MAX_USES: z.string().optional(),
});

type BaseEnv = z.infer<typeof BaseEnvSchema>;

type WorkerEnv = Omit<
  BaseEnv,
  "TELEGRAM_INVITE_TTL_SECONDS" | "TELEGRAM_INVITE_MAX_USES"
> & {
  TELEGRAM_INVITE_TTL_SECONDS?: number;
  TELEGRAM_INVITE_MAX_USES?: number;
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

const dotenvResult = dotenv.config();

if (dotenvResult.error) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const fallbackEnvPath = path.resolve(moduleDir, "../../..", ".env");

  if (fs.existsSync(fallbackEnvPath)) {
    dotenv.config({ path: fallbackEnvPath });
  }
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
};

let connection: Redis;
const prisma = new PrismaClient();
const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

const workers: Worker[] = [];
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
      channel: true,
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

  if (channelAccess.channel.provider !== $Enums.ChannelProvider.TELEGRAM) {
    logger.warn(
      {
        jobId: job.id,
        subscriptionId: data.subscriptionId,
        channelId: data.channelId,
        provider: channelAccess.channel.provider,
      },
      "Channel provider is not Telegram, skipping grant job"
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

async function processRevokeAccess(
  job: Job<RevokeAccessPayload>
): Promise<void> {
  const data = RevokeAccessPayloadSchema.parse(job.data);
  const channelAccesses = await prisma.channelAccess.findMany({
    where: { subscriptionId: data.subscriptionId },
    include: {
      channel: true,
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

  await Promise.allSettled(workers.map((worker) => worker.close()));
  await prisma.$disconnect().catch((error: unknown) => {
    logger.error({ error: error as Error }, "Failed to disconnect Prisma client");
  });

  await connection.quit().catch((error: unknown) => {
    logger.error({ error: error as Error }, "Failed to close Redis connection");
  });

  logger.info("Worker shutdown complete");
}

export async function bootstrapWorkers(): Promise<void> {
  // Initialize Redis connection first
  connection = await initRedis();

  const me = await bot.api.getMe();
  logger.info(
    {
      botId: me.id,
      username: me.username,
    },
    "Telegram API client initialised"
  );

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
    logger.info(
      { jobId: job.id, queue: queueNames.grantAccess },
      "Grant access job completed"
    );
  });

  grantWorker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, queue: queueNames.grantAccess, error: error as Error },
      "Grant access job failed"
    );
  });

  revokeWorker.on("completed", (job) => {
    logger.info(
      { jobId: job.id, queue: queueNames.revokeAccess },
      "Revoke access job completed"
    );
  });

  revokeWorker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, queue: queueNames.revokeAccess, error: error as Error },
      "Revoke access job failed"
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
