import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import { Bot, GrammyError, HttpError } from "grammy";
import { fileURLToPath } from "node:url";
import { argv, env as processEnv } from "node:process";
import { z } from "zod";

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

function resolveEnvFile(): string | undefined {
  const explicit = processEnv.ENV_FILE?.trim();
  if (explicit) {
    const envPath = isAbsolute(explicit)
      ? explicit
      : resolve(findRepoRoot(process.cwd()), explicit);
    return envPath;
  }

  const cwd = process.cwd();
  const repoRoot = findRepoRoot(cwd);
  const isProduction = processEnv.NODE_ENV === "production";
  const preferredName = isProduction ? ".env.production" : ".env.local";
  const candidates = [
    resolve(cwd, preferredName),
    resolve(repoRoot, preferredName),
    resolve(cwd, ".env"),
    resolve(repoRoot, ".env"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

const envFile = resolveEnvFile();
if (envFile) {
  config({ path: envFile });
}

const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN requis"),
  TELEGRAM_STARS_API_URL: z.string().url().optional(),
  TELEGRAM_STARS_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  API_URL: z.string().url().optional(),
});

type BotConfig = {
  token: string;
  apiBaseUrl: string;
  webhookSecret?: string;
};

type TelegramStarsInvoiceResponse = {
  subscriptionId: string;
  title: string;
  description: string;
  payload: string;
  currency: string;
  prices: Array<{ label: string; amount: number }>;
};

type PreCheckoutValidationResponse = {
  valid: boolean;
  error?: string;
};

type ChannelVerificationResponse = {
  success: boolean;
  message?: string;
};

// Pattern pour détecter les codes de vérification (ex: TGPLUGIN-a1b2c3d4)
const VERIFICATION_CODE_PATTERN = /^TGPLUGIN-[a-z0-9]{8}$/i;

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logData = data ? ` ${JSON.stringify(data)}` : '';
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
  console[level](`[${timestamp}] ${prefix} ${message}${logData}`);
}

function loadEnv(): BotConfig {
  const parsed = EnvSchema.safeParse(processEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Configuration bot invalide: ${issues}`);
  }

  const apiBaseUrl =
    parsed.data.TELEGRAM_STARS_API_URL ??
    parsed.data.API_URL ??
    parsed.data.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000";

  return {
    token: parsed.data.TELEGRAM_BOT_TOKEN,
    apiBaseUrl,
    webhookSecret: parsed.data.TELEGRAM_STARS_WEBHOOK_SECRET,
  };
}

export function createBot(config: BotConfig) {
  const bot = new Bot(config.token);
  const apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, "");
  const apiHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.webhookSecret) {
    apiHeaders["x-telegram-stars-secret"] = config.webhookSecret;
  }

  async function postApi<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API ${response.status} ${response.statusText}: ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  bot.command("start", (ctx) =>
    ctx.reply(
      "👋 Bienvenue ! Votre accès sera géré automatiquement par la plateforme."
    )
  );

  // Handle /buy command for Telegram Stars payments
  bot.command("buy", async (ctx) => {
    const args = ctx.match?.trim().split(' ');
    if (!args || args.length === 0 || args[0] === '') {
      await ctx.reply(
        "❌ Usage: /buy <plan_id>\n\nExemple: /buy plan_abc123"
      );
      return;
    }

    const planId = args[0];

    try {
      if (!ctx.from) {
        await ctx.reply("❌ Impossible d'identifier votre compte Telegram.");
        return;
      }

      const displayName = [ctx.from.first_name, ctx.from.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      const invoice = await postApi<TelegramStarsInvoiceResponse>(
        "/payments/telegram-stars/invoice",
        {
          planId,
          customer: {
            telegramUserId: String(ctx.from.id),
            telegramUsername: ctx.from.username,
            displayName: displayName.length > 0 ? displayName : undefined,
          },
        }
      );

      await ctx.replyWithInvoice(
        invoice.title,
        invoice.description,
        invoice.payload,
        invoice.currency,
        invoice.prices,
        {
          provider_token: "",
        }
      );
    } catch (error) {
      log('error', 'Error creating invoice', {
        planId,
        userId: ctx.from?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await ctx.reply(
        "❌ Erreur lors de la création de la facture. Veuillez réessayer plus tard."
      );
    }
  });

  // Handle successful payments
  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;

    if (!payment) {
      return;
    }

    const telegramUserId = ctx.from?.id;

    log('info', 'Received successful payment', {
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
      telegramUserId,
      totalAmount: payment.total_amount,
      currency: payment.currency,
    });

    if (telegramUserId) {
      try {
        await postApi("/payments/telegram-stars/webhook", {
          telegramPaymentChargeId: payment.telegram_payment_charge_id,
          telegramUserId: String(telegramUserId),
          totalAmount: payment.total_amount,
          invoicePayload: payment.invoice_payload,
          providerPaymentChargeId: payment.provider_payment_charge_id,
        });
        log('info', 'Payment webhook sent successfully', {
          telegramPaymentChargeId: payment.telegram_payment_charge_id,
        });
      } catch (error) {
        log('error', 'Error processing Telegram Stars payment', {
          telegramPaymentChargeId: payment.telegram_payment_charge_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      log('warn', 'Missing Telegram user id on successful payment update', {
        telegramPaymentChargeId: payment.telegram_payment_charge_id,
      });
    }

    await ctx.reply(
      "✅ Paiement reçu avec succès !\n\n" +
      "Votre accès est en cours d'activation. Vous recevrez un lien d'invitation dans quelques instants."
    );
  });

  // Handle pre-checkout queries - validate before approving payment
  bot.on("pre_checkout_query", async (ctx) => {
    const query = ctx.preCheckoutQuery;

    log('info', 'Received pre-checkout query', {
      id: query.id,
      from: query.from.id,
      currency: query.currency,
      totalAmount: query.total_amount,
    });

    try {
      // Validate the pre-checkout with the API
      const validation = await postApi<PreCheckoutValidationResponse>(
        "/payments/telegram-stars/validate-pre-checkout",
        { invoicePayload: query.invoice_payload }
      );

      if (validation.valid) {
        log('info', 'Pre-checkout validation passed', { queryId: query.id });
        await ctx.answerPreCheckoutQuery(true);
      } else {
        log('warn', 'Pre-checkout validation failed', {
          queryId: query.id,
          error: validation.error,
        });
        await ctx.answerPreCheckoutQuery(
          false,
          validation.error || "Ce produit n'est plus disponible"
        );
      }
    } catch (error) {
      log('error', 'Pre-checkout validation error', {
        queryId: query.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // On error, reject the payment to be safe
      await ctx.answerPreCheckoutQuery(
        false,
        "Erreur de validation. Veuillez réessayer."
      );
    }
  });

  // Handle channel verification codes posted in channels
  bot.on("channel_post", async (ctx) => {
    const text = ctx.channelPost?.text?.trim();
    if (!text || !VERIFICATION_CODE_PATTERN.test(text)) return;

    const code = text.toUpperCase();
    const chatId = ctx.chat.id.toString();
    const chatTitle = ctx.chat.title || "";
    const chatUsername = ctx.chat.username || null;
    const chatType = ctx.chat.type; // "channel"

    log('info', 'Received verification code in channel', {
      code,
      chatId,
      chatTitle,
      chatType,
    });

    try {
      // Vérifier que le bot a les droits admin
      const botMember = await ctx.api.getChatMember(ctx.chat.id, ctx.me.id);
      const isAdmin = ["administrator", "creator"].includes(botMember.status);

      if (!isAdmin) {
        log('warn', 'Bot is not admin in channel', { chatId, status: botMember.status });
        return;
      }

      // Envoyer la vérification à l'API
      const result = await postApi<ChannelVerificationResponse>(
        "/channels/verification/verify",
        {
          code,
          telegramChatId: chatId,
          telegramTitle: chatTitle,
          telegramUsername: chatUsername,
          chatType: "CHANNEL",
        }
      );

      if (result.success) {
        log('info', 'Channel verification successful', { code, chatId });
        // Supprimer le message de vérification pour plus de propreté
        try {
          await ctx.deleteMessage();
        } catch {
          // Ignorer si on ne peut pas supprimer
        }
      } else {
        log('warn', 'Channel verification failed', { code, chatId, message: result.message });
      }
    } catch (error) {
      log('error', 'Error verifying channel', {
        code,
        chatId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Handle verification codes posted in groups/supergroups
  bot.on("message", async (ctx) => {
    // Ignorer les messages privés (les channels ne déclenchent pas cet événement)
    if (ctx.chat.type === "private") return;

    const text = ctx.message?.text?.trim();
    if (!text || !VERIFICATION_CODE_PATTERN.test(text)) return;

    const code = text.toUpperCase();
    const chatId = ctx.chat.id.toString();
    const chatTitle = ctx.chat.title || "";
    const chatUsername = ctx.chat.username || null;
    const chatType = ctx.chat.type; // "group" | "supergroup"

    log('info', 'Received verification code in group', {
      code,
      chatId,
      chatTitle,
      chatType,
    });

    try {
      // Vérifier que le bot a les droits admin
      const botMember = await ctx.api.getChatMember(ctx.chat.id, ctx.me.id);
      const isAdmin = ["administrator", "creator"].includes(botMember.status);

      if (!isAdmin) {
        log('warn', 'Bot is not admin in group', { chatId, status: botMember.status });
        return;
      }

      // Envoyer la vérification à l'API
      const result = await postApi<ChannelVerificationResponse>(
        "/channels/verification/verify",
        {
          code,
          telegramChatId: chatId,
          telegramTitle: chatTitle,
          telegramUsername: chatUsername,
          chatType: "GROUP",
        }
      );

      if (result.success) {
        log('info', 'Group verification successful', { code, chatId });
        // Supprimer le message de vérification
        try {
          await ctx.deleteMessage();
        } catch {
          // Ignorer si on ne peut pas supprimer
        }
      } else {
        log('warn', 'Group verification failed', { code, chatId, message: result.message });
      }
    } catch (error) {
      log('error', 'Error verifying group', {
        code,
        chatId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  bot.catch((err) => {
    const { ctx, error } = err;
    if (error instanceof GrammyError) {
      log('error', 'Telegram API error', {
        updateId: ctx.update.update_id,
        description: error.description,
        errorCode: error.error_code,
      });
    } else if (error instanceof HttpError) {
      log('error', 'Telegram network error', {
        message: error.message,
      });
    } else {
      log('error', 'Unknown bot error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return bot;
}

export async function startBot() {
  const config = loadEnv();
  const bot = createBot(config);

  await bot.start({
    drop_pending_updates: true,
  });

  log('info', 'Telegram bot started (long polling)', {
    apiBaseUrl: config.apiBaseUrl,
    hasWebhookSecret: !!config.webhookSecret,
  });
}

const isExecutedDirectly =
  argv[1] && argv[1] === fileURLToPath(import.meta.url);

if (isExecutedDirectly) {
  startBot().catch((error: unknown) => {
    console.error("Échec du démarrage du bot:", error);
    process.exitCode = 1;
  });
}
