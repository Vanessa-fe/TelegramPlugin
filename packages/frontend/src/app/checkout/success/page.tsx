"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const botUsername =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "SublynkBot";

// Same format the API generates and Telegram accepts as a start payload
const ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const t = useTranslations("checkoutSuccess");

  useEffect(() => {
    const id = searchParams.get("session_id");
    setSessionId(id);
    const token = searchParams.get("access");
    setAccessToken(token && ACCESS_TOKEN_PATTERN.test(token) ? token : null);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t("title")}</h1>

        <p className="text-gray-600 mb-6">{t("description")}</p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-3">
          <p className="text-sm text-blue-900">
            {accessToken
              ? t("telegramNoticeLinked", { bot: `@${botUsername}` })
              : t("telegramNotice", { bot: `@${botUsername}` })}
          </p>
          <Button asChild variant="default" className="w-full">
            <a
              href={`https://t.me/${botUsername}?start=${accessToken ?? "access"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("openBot")}
            </a>
          </Button>
          <p className="text-xs text-blue-900">{t("emailNotice")}</p>
        </div>

        {sessionId && (
          <p className="text-xs text-gray-500 mb-6 font-mono">
            {t("sessionId")} {sessionId}
          </p>
        )}

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              {t("backHome")}
            </Button>
          </Link>
          <p className="text-xs text-gray-500">{t("safeToClose")}</p>
        </div>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  const t = useTranslations("checkoutSuccess");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          {t("loading")}
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
