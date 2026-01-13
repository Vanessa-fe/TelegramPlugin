import { Worker } from "bullmq";
import { Bot, GrammyError, HttpError } from "grammy";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { $Enums, PrismaClient } from "@prisma/client";
import { GrantAccessPayload as GrantAccessPayloadSchema, RevokeAccessPayload as RevokeAccessPayloadSchema, queueNames, } from "@telegram-plugin/shared";
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
function parseOptionalInteger(value, { varName, min, max, }) {
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
const env = {
    ...baseEnv,
    TELEGRAM_INVITE_TTL_SECONDS: parseOptionalInteger(baseEnv.TELEGRAM_INVITE_TTL_SECONDS, {
        varName: "TELEGRAM_INVITE_TTL_SECONDS",
        min: 60,
        max: 60 * 60 * 24 * 7,
    }),
    TELEGRAM_INVITE_MAX_USES: parseOptionalInteger(baseEnv.TELEGRAM_INVITE_MAX_USES, {
        varName: "TELEGRAM_INVITE_MAX_USES",
        min: 1,
        max: 100_000,
    }),
};
const connection = new Redis(env.REDIS_URL);
const prisma = new PrismaClient();
const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
const workers = [];
let isShuttingDown = false;
function extractInviteHash(inviteLink) {
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
async function revokeExistingInviteLink(chatId, inviteLink) {
    try {
        await bot.api.revokeChatInviteLink(chatId, inviteLink);
    }
    catch (error) {
        if (error instanceof GrammyError &&
            (error.error_code === 400 ||
                error.description.includes("CHAT_ADMIN_REQUIRED"))) {
            logger.warn({
                chatId,
                inviteLink,
                description: error.description,
            }, "Failed to revoke existing invite link on Telegram, continuing");
            return;
        }
        if (error instanceof HttpError) {
            logger.error({ chatId, inviteLink, error: error.error }, "Network error while revoking invite link");
            throw error;
        }
        throw error;
    }
}
async function processGrantAccess(job) {
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
        },
    });
    if (!channelAccess) {
        logger.warn({
            jobId: job.id,
            subscriptionId: data.subscriptionId,
            channelId: data.channelId,
        }, "Channel access not found, skipping grant job");
        return;
    }
    if (channelAccess.channel.provider !== $Enums.ChannelProvider.TELEGRAM) {
        logger.warn({
            jobId: job.id,
            subscriptionId: data.subscriptionId,
            channelId: data.channelId,
            provider: channelAccess.channel.provider,
        }, "Channel provider is not Telegram, skipping grant job");
        return;
    }
    const chatId = channelAccess.channel.externalId;
    if (!chatId) {
        throw new Error(`Missing externalId for channel ${channelAccess.channelId}, cannot grant access`);
    }
    if (channelAccess.invite?.inviteLink &&
        channelAccess.invite.status === $Enums.InviteStatus.ACTIVE) {
        await revokeExistingInviteLink(chatId, channelAccess.invite.inviteLink);
    }
    const now = new Date();
    const inviteOptions = {};
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
        logger.info({
            jobId: job.id,
            subscriptionId: data.subscriptionId,
            channelId: data.channelId,
        }, "Telegram invite generated and channel access granted");
    }
    catch (error) {
        if (error instanceof GrammyError) {
            logger.error({
                jobId: job.id,
                subscriptionId: data.subscriptionId,
                channelId: data.channelId,
                description: error.description,
            }, "Telegram API error while creating invite link");
        }
        else if (error instanceof HttpError) {
            logger.error({
                jobId: job.id,
                subscriptionId: data.subscriptionId,
                channelId: data.channelId,
                error: error.error,
            }, "Network error while contacting Telegram API");
        }
        else {
            logger.error({
                jobId: job.id,
                subscriptionId: data.subscriptionId,
                channelId: data.channelId,
            }, "Unexpected error while granting channel access");
        }
        throw error;
    }
}
async function processRevokeAccess(job) {
    const data = RevokeAccessPayloadSchema.parse(job.data);
    const channelAccesses = await prisma.channelAccess.findMany({
        where: { subscriptionId: data.subscriptionId },
        include: {
            channel: true,
            invite: true,
        },
    });
    if (channelAccesses.length === 0) {
        logger.warn({
            jobId: job.id,
            subscriptionId: data.subscriptionId,
        }, "No channel access found to revoke");
        return;
    }
    const now = new Date();
    for (const access of channelAccesses) {
        if (access.channel.provider !== $Enums.ChannelProvider.TELEGRAM) {
            continue;
        }
        const chatId = access.channel.externalId;
        if (!chatId) {
            logger.error({
                jobId: job.id,
                channelId: access.channelId,
            }, "Cannot revoke access: missing channel externalId");
            continue;
        }
        if (access.invite?.inviteLink &&
            access.invite.status === $Enums.InviteStatus.ACTIVE) {
            try {
                await bot.api.revokeChatInviteLink(chatId, access.invite.inviteLink);
            }
            catch (error) {
                if (error instanceof GrammyError && error.error_code === 400) {
                    logger.warn({
                        jobId: job.id,
                        channelId: access.channelId,
                        description: error.description,
                    }, "Invite already invalid on Telegram");
                }
                else if (error instanceof HttpError) {
                    logger.error({
                        jobId: job.id,
                        channelId: access.channelId,
                        error: error.error,
                    }, "Network error while revoking invite link");
                    throw error;
                }
                else {
                    throw error;
                }
            }
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
    logger.info({
        jobId: job.id,
        subscriptionId: data.subscriptionId,
        revokedCount: channelAccesses.length,
    }, "Channel accesses revoked");
}
async function shutdown(signal) {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;
    logger.info({ signal }, "Shutting down workers");
    await Promise.allSettled(workers.map((worker) => worker.close()));
    await prisma.$disconnect().catch((error) => {
        logger.error({ error: error }, "Failed to disconnect Prisma client");
    });
    await connection.quit().catch((error) => {
        logger.error({ error: error }, "Failed to close Redis connection");
    });
    logger.info("Worker shutdown complete");
}
export async function bootstrapWorkers() {
    const me = await bot.api.getMe();
    logger.info({
        botId: me.id,
        username: me.username,
    }, "Telegram API client initialised");
    const grantWorker = new Worker(queueNames.grantAccess, processGrantAccess, {
        connection,
        concurrency: 4,
    });
    const revokeWorker = new Worker(queueNames.revokeAccess, processRevokeAccess, {
        connection,
        concurrency: 2,
    });
    workers.push(grantWorker, revokeWorker);
    await Promise.all(workers.map((worker) => worker.waitUntilReady()));
    grantWorker.on("completed", (job) => {
        logger.info({ jobId: job.id, queue: queueNames.grantAccess }, "Grant access job completed");
    });
    grantWorker.on("failed", (job, error) => {
        logger.error({ jobId: job?.id, queue: queueNames.grantAccess, error: error }, "Grant access job failed");
    });
    revokeWorker.on("completed", (job) => {
        logger.info({ jobId: job.id, queue: queueNames.revokeAccess }, "Revoke access job completed");
    });
    revokeWorker.on("failed", (job, error) => {
        logger.error({ jobId: job?.id, queue: queueNames.revokeAccess, error: error }, "Revoke access job failed");
    });
    const signals = ["SIGINT", "SIGTERM"];
    signals.forEach((signal) => {
        process.once(signal, () => {
            shutdown(signal).catch((error) => {
                logger.error({ error: error }, "Error during worker shutdown");
            });
        });
    });
    logger.info("Workers BullMQ démarrés");
}
const isExecutedDirectly = argv[1] && argv[1] === fileURLToPath(import.meta.url);
if (isExecutedDirectly) {
    bootstrapWorkers().catch((error) => {
        logger.error({ error: error }, "Worker bootstrap failed");
        shutdown().finally(() => {
            process.exitCode = 1;
        });
    });
}
//# sourceMappingURL=main.js.map