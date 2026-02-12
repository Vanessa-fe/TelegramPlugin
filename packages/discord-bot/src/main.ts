import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import {
  Client,
  GatewayIntentBits,
  Events,
  PermissionFlagsBits,
} from "discord.js";
import type { Guild, GuildMember, Message, Role } from "discord.js";
import { fileURLToPath } from "node:url";
import { argv, env as processEnv } from "node:process";
import { z } from "zod";

// Pattern to detect Discord verification codes (ex: DISCORD-A1B2C3D4)
const VERIFICATION_CODE_PATTERN = /^DISCORD-[A-Z0-9]{8}$/i;

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
  DISCORD_BOT_TOKEN: z.string().min(1, "DISCORD_BOT_TOKEN required"),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  DISCORD_API_URL: z.string().url().optional(),
});

type BotConfig = {
  token: string;
  apiBaseUrl: string;
};

type ChannelVerificationResponse = {
  success: boolean;
  message?: string;
};

type RoleGrantResult = {
  success: boolean;
  message?: string;
};

function log(
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const logData = data ? ` ${JSON.stringify(data)}` : "";
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
  console[level](`[${timestamp}] ${prefix} ${message}${logData}`);
}

function loadEnv(): BotConfig {
  const parsed = EnvSchema.safeParse(processEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid bot configuration: ${issues}`);
  }

  const apiBaseUrl =
    parsed.data.DISCORD_API_URL ??
    parsed.data.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  return {
    token: parsed.data.DISCORD_BOT_TOKEN,
    apiBaseUrl,
  };
}

export function createBot(config: BotConfig) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, "");
  const apiHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

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

  // Check if bot has required permissions in guild
  function hasRequiredPermissions(guild: Guild): boolean {
    const botMember = guild.members.me;
    if (!botMember) return false;

    return botMember.permissions.has(PermissionFlagsBits.ManageRoles);
  }

  // Grant role to a member
  async function grantRole(member: GuildMember, role: Role): Promise<boolean> {
    try {
      await member.roles.add(role, "Paid access granted via monetization platform");
      log("info", "Role granted to member", {
        guildId: member.guild.id,
        memberId: member.id,
        roleId: role.id,
        roleName: role.name,
      });
      return true;
    } catch (error) {
      log("error", "Failed to grant role", {
        guildId: member.guild.id,
        memberId: member.id,
        roleId: role.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  // Revoke role from a member
  async function revokeRole(member: GuildMember, role: Role): Promise<boolean> {
    try {
      await member.roles.remove(role, "Access revoked via monetization platform");
      log("info", "Role revoked from member", {
        guildId: member.guild.id,
        memberId: member.id,
        roleId: role.id,
        roleName: role.name,
      });
      return true;
    } catch (error) {
      log("error", "Failed to revoke role", {
        guildId: member.guild.id,
        memberId: member.id,
        roleId: role.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  // Send DM to a user
  async function sendDM(userId: string, message: string): Promise<boolean> {
    try {
      const user = await client.users.fetch(userId);
      await user.send(message);
      log("info", "DM sent to user", { userId });
      return true;
    } catch (error) {
      log("warn", "Could not send DM to user", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  // Handle bot ready event
  client.once(Events.ClientReady, (readyClient) => {
    log("info", "Discord bot is ready", {
      username: readyClient.user.tag,
      guildCount: readyClient.guilds.cache.size,
    });

    // Log guilds the bot is in
    readyClient.guilds.cache.forEach((guild) => {
      log("info", "Bot is in guild", {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: guild.memberCount,
      });
    });
  });

  // Handle bot joining a new guild
  client.on(Events.GuildCreate, (guild) => {
    log("info", "Bot joined new guild", {
      guildId: guild.id,
      guildName: guild.name,
      memberCount: guild.memberCount,
    });

    // Check permissions
    if (!hasRequiredPermissions(guild)) {
      log("warn", "Bot lacks required permissions in guild", {
        guildId: guild.id,
        guildName: guild.name,
      });
    }
  });

  // Handle bot being removed from a guild
  client.on(Events.GuildDelete, (guild) => {
    log("info", "Bot removed from guild", {
      guildId: guild.id,
      guildName: guild.name,
    });
  });

  // Handle messages for verification code detection
  async function handleMessageCreate(message: Message): Promise<void> {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    const text = message.content.trim();
    if (!VERIFICATION_CODE_PATTERN.test(text)) return;

    const code = text.toUpperCase();
    const guild = message.guild;
    const guildId = guild.id;
    const guildName = guild.name;

    log("info", "Received verification code", {
      code,
      guildId,
      guildName,
      channelId: message.channel.id,
      authorId: message.author.id,
    });

    try {
      // Check if bot has required permissions
      if (!hasRequiredPermissions(guild)) {
        log("warn", "Bot lacks permissions to verify guild", {
          guildId,
          guildName,
        });
        await message.reply(
          "❌ Je n'ai pas les permissions nécessaires (Gérer les rôles). " +
            "Veuillez vérifier mes permissions et réessayer."
        );
        return;
      }

      // Get list of roles for API to store
      const roles = guild.roles.cache
        .filter((role) => !role.managed && role.name !== "@everyone")
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
        }))
        .sort((a, b) => b.position - a.position);

      // Send verification to API
      const result = await postApi<ChannelVerificationResponse>(
        "/channels/verification/discord/verify",
        {
          code,
          discordGuildId: guildId,
          discordGuildName: guildName,
          roles,
        }
      );

      if (result.success) {
        log("info", "Discord guild verification successful", {
          code,
          guildId,
          guildName,
        });

        // Delete the verification message for cleanliness
        try {
          await message.delete();
        } catch {
          // Ignore if we can't delete
        }

        // Notify in channel
        if (message.channel.isSendable()) {
          await message.channel.send(
            "✅ **Serveur vérifié avec succès !**\n\n" +
              "Vous pouvez maintenant retourner au tableau de bord pour sélectionner le rôle d'accès payant."
          );
        }
      } else {
        log("warn", "Discord guild verification failed", {
          code,
          guildId,
          message: result.message,
        });
        await message.reply(
          `❌ Échec de la vérification: ${result.message || "Code invalide ou expiré"}`
        );
      }
    } catch (error) {
      log("error", "Error verifying Discord guild", {
        code,
        guildId,
        error: error instanceof Error ? error.message : String(error),
      });
      await message.reply(
        "❌ Une erreur est survenue lors de la vérification. Veuillez réessayer."
      );
    }
  }

  client.on(Events.MessageCreate, (message: Message) => {
    void handleMessageCreate(message);
  });

  // Expose methods for worker to use
  return {
    client,
    grantRole,
    revokeRole,
    sendDM,

    // Grant access to a user by Discord ID
    async grantAccessToUser(
      guildId: string,
      roleId: string,
      discordUserId: string
    ): Promise<RoleGrantResult> {
      try {
        const guild = await client.guilds.fetch(guildId);
        const role = await guild.roles.fetch(roleId);

        if (!role) {
          return { success: false, message: "Role not found" };
        }

        const member = await guild.members.fetch(discordUserId);
        const granted = await grantRole(member, role);

        return {
          success: granted,
          message: granted ? "Role granted successfully" : "Failed to grant role",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Error granting access to user", {
          guildId,
          roleId,
          discordUserId,
          error: message,
        });
        return { success: false, message };
      }
    },

    // Revoke access from a user by Discord ID
    async revokeAccessFromUser(
      guildId: string,
      roleId: string,
      discordUserId: string
    ): Promise<RoleGrantResult> {
      try {
        const guild = await client.guilds.fetch(guildId);
        const role = await guild.roles.fetch(roleId);

        if (!role) {
          return { success: false, message: "Role not found" };
        }

        const member = await guild.members.fetch(discordUserId);
        const revoked = await revokeRole(member, role);

        return {
          success: revoked,
          message: revoked ? "Role revoked successfully" : "Failed to revoke role",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Error revoking access from user", {
          guildId,
          roleId,
          discordUserId,
          error: message,
        });
        return { success: false, message };
      }
    },

    // Get guild info for verification
    async getGuildInfo(guildId: string) {
      try {
        const guild = await client.guilds.fetch(guildId);
        const roles = guild.roles.cache
          .filter((role) => !role.managed && role.name !== "@everyone")
          .map((role) => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
            position: role.position,
          }))
          .sort((a, b) => b.position - a.position);

        return {
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          roles,
          hasPermissions: hasRequiredPermissions(guild),
        };
      } catch (error) {
        log("error", "Error fetching guild info", {
          guildId,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    },
  };
}

export async function startBot() {
  const botConfig = loadEnv();
  const bot = createBot(botConfig);

  await bot.client.login(botConfig.token);

  log("info", "Discord bot started", {
    apiBaseUrl: botConfig.apiBaseUrl,
  });

  // Handle graceful shutdown
  const shutdown = () => {
    log("info", "Shutting down Discord bot...");
    void bot.client.destroy();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return bot;
}

const isExecutedDirectly =
  argv[1] && argv[1] === fileURLToPath(import.meta.url);

if (isExecutedDirectly) {
  startBot().catch((error: unknown) => {
    console.error("Failed to start Discord bot:", error);
    process.exitCode = 1;
  });
}
