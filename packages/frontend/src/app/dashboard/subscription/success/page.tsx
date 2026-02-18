"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SubscriptionSuccessPage() {
  const t = useTranslations("platformSubscriptionPage.success");
  const router = useRouter();
  const searchParams = useSearchParams();

  const freePlan = searchParams.get("free_plan");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Redirect to subscription page after 3 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard/subscription");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-3">
        {t("title")}
      </h1>

      <p className="text-text-secondary max-w-md mb-6">
        {freePlan ? t("freePlanActivated", { plan: freePlan }) : t("description")}
      </p>

      <p className="text-sm text-text-secondary">
        {t("redirecting")}
      </p>
    </div>
  );
}
