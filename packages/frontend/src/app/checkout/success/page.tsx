"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const t = useTranslations("checkoutSuccess");

  useEffect(() => {
    const id = searchParams.get("session_id");
    setSessionId(id);
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

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">{t("emailNotice")}</p>
        </div>

        {sessionId && (
          <p className="text-xs text-gray-500 mb-6 font-mono">
            {t("sessionId")}: {sessionId}
          </p>
        )}

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button variant="default" className="w-full">
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
