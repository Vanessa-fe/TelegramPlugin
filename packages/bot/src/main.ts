import { Bot, GrammyError, HttpError } from "grammy";
import { fileURLToPath } from "node:url";
import { argv, env as processEnv } from "node:process";
import { z } from "zod";

const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN requis"),
});

function loadEnv() {
  const parsed = EnvSchema.safeParse(processEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Configuration bot invalide: ${issues}`);
  }
  return parsed.data;
}

export function createBot(token: string) {
  const bot = new Bot(token);

  bot.command("start", (ctx) =>
    ctx.reply(
      "👋 Bienvenue ! Votre accès sera géré automatiquement par la plateforme."
    )
  );

  bot.catch((err) => {
    const { ctx, error } = err;
    if (error instanceof GrammyError) {
      console.error(
        `Erreur API Telegram sur update ${String(ctx.update.update_id)}:`,
        error.description
      );
    } else if (error instanceof HttpError) {
      console.error("Erreur réseau Telegram:", error);
    } else {
      console.error("Erreur bot inconnue:", error);
    }
  });

  return bot;
}

export async function startBot() {
  const { TELEGRAM_BOT_TOKEN } = loadEnv();
  const bot = createBot(TELEGRAM_BOT_TOKEN);

  await bot.start({
    drop_pending_updates: true,
  });

  console.info("🤖 Bot Telegram démarré (long polling).");
}

const isExecutedDirectly =
  argv[1] && argv[1] === fileURLToPath(import.meta.url);

if (isExecutedDirectly) {
  startBot().catch((error: unknown) => {
    console.error("Échec du démarrage du bot:", error);
    process.exitCode = 1;
  });
}
