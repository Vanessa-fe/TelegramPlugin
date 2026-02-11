"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { TelegramConnectWizard } from "@/components/channels/telegram-connect-wizard";
import { DiscordConnectWizard } from "@/components/channels/discord-connect-wizard";
import { useAuth } from "@/contexts/auth-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

type ProviderType = "telegram" | "discord" | null;

// Icons
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function NewChannelPage() {
  const t = useTranslations("channels");
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(null);

  if (!user) return null;

  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "SublynkBot";
  const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "";

  // If provider is selected, show the appropriate wizard
  if (selectedProvider === "telegram") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProvider(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-3xl font-bold">{t("new.title")}</h1>
            <p className="mt-2 text-gray-600">{t("new.subtitle")}</p>
          </div>
        </div>

        <TelegramConnectWizard botUsername={botUsername} />
      </div>
    );
  }

  if (selectedProvider === "discord") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProvider(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-3xl font-bold">{t("new.discordTitle")}</h1>
            <p className="mt-2 text-gray-600">{t("new.discordSubtitle")}</p>
          </div>
        </div>

        <DiscordConnectWizard discordClientId={discordClientId} />
      </div>
    );
  }

  // Provider selection screen
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/channels">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold">{t("new.title")}</h1>
          <p className="mt-2 text-gray-600">{t("new.selectProvider")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="p-6 cursor-pointer transition-all hover:border-[#0088cc] hover:shadow-md"
          onClick={() => setSelectedProvider("telegram")}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#0088cc]/10">
              <TelegramIcon className="w-8 h-8 text-[#0088cc]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Telegram</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("new.telegramDescription")}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer transition-all hover:border-[#5865F2] hover:shadow-md"
          onClick={() => setSelectedProvider("discord")}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#5865F2]/10">
              <DiscordIcon className="w-8 h-8 text-[#5865F2]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Discord</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("new.discordDescription")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
