"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export default function CheckoutCancelPage() {
  const t = useTranslations("checkoutCancel");
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-orange-100 p-3">
            <XCircle className="h-16 w-16 text-orange-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t("title")}</h1>

        <p className="text-gray-600 mb-6">{t("description")}</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">{t("helpNotice")}</p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => window.history.back()} className="w-full">
            {t("retry")}
          </Button>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              {t("backHome")}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
