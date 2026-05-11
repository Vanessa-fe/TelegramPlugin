"use client";

import { Button } from "@/components/ui/button";
import { billingApi } from "@/lib/api/billing";
import { platformSubscriptionApi } from "@/lib/api/platform-subscription";
import type { StripeStatus } from "@/types/billing";
import type { PlatformSubscription } from "@/types/platform-subscription";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const STRIPE_PLATFORM_SETUP_ERROR_CODE =
  "STRIPE_PLATFORM_PROFILE_INCOMPLETE";

function extractBillingErrorPayload(error: unknown): {
  code?: string;
  message?: string;
} {
  const axiosError = error as {
    response?: {
      data?: {
        code?: string;
        message?: string | string[];
      };
    };
  };

  const payload = axiosError.response?.data;
  const message = payload?.message;

  return {
    code: payload?.code,
    message: Array.isArray(message) ? message[0] : message,
  };
}

function isStripePlatformSetupError(error: unknown): boolean {
  const { code, message } = extractBillingErrorPayload(error);

  if (code === STRIPE_PLATFORM_SETUP_ERROR_CODE) {
    return true;
  }

  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes("managing losses for connected accounts") ||
    normalized.includes("collecting requirements for connected accounts") ||
    normalized.includes("platform-profile") ||
    normalized.includes("plateforme") ||
    normalized.includes("platform profile")
  );
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningStripe, setIsOpeningStripe] = useState(false);
  const [isPlatformSetupBlocked, setIsPlatformSetupBlocked] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const [billingStatus, subscriptionStatus] = await Promise.all([
        billingApi.getStripeStatus(),
        platformSubscriptionApi.getSubscription(),
      ]);
      setStatus(billingStatus);
      setSubscription(subscriptionStatus);
    } catch (error) {
      const { message } = extractBillingErrorPayload(error);
      toast.error(message || t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleConnectStripe() {
    try {
      setIsConnecting(true);
      setIsPlatformSetupBlocked(false);
      const { url } = await billingApi.createStripeConnectLink();
      window.location.href = url;
    } catch (error) {
      const platformSetupBlocked = isStripePlatformSetupError(error);
      const { message } = extractBillingErrorPayload(error);

      setIsPlatformSetupBlocked(platformSetupBlocked);
      toast.error(
        platformSetupBlocked ? t("platformSetupError") : message || t("connectError"),
      );
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleOpenStripe() {
    try {
      setIsOpeningStripe(true);
      const { url } = await billingApi.createStripeLoginLink();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const { message } = extractBillingErrorPayload(error);
      toast.error(message || t("dashboardError"));
    } finally {
      setIsOpeningStripe(false);
    }
  }

  const stripeReady = useMemo(() => {
    if (!status?.connected) {
      return false;
    }
    return Boolean(status.chargesEnabled && status.detailsSubmitted);
  }, [status]);

  const hasActiveSubscription = useMemo(() => {
    if (!subscription) {
      return false;
    }

    if (subscription.isGrandfathered) {
      return true;
    }

    if (
      subscription.status === "ACTIVE" ||
      subscription.status === "TRIALING"
    ) {
      return true;
    }

    return Boolean(
      subscription.graceUntil && new Date(subscription.graceUntil) > new Date(),
    );
  }, [subscription]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
          {t("title")}
        </h1>
        <p className="mt-1 text-text-secondary">{t("subtitle")}</p>
      </div>

      {/* Platform subscription warning */}
      {!hasActiveSubscription && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              {t("saasWarning.title")}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {t("saasWarning.description")}
            </p>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 mt-2"
            >
              {t("saasWarning.choosePlan")}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {isPlatformSetupBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">
              {t("platformSetupBlocked.title")}
            </p>
            <p className="text-sm text-red-700 mt-1">
              {t("platformSetupBlocked.description")}
            </p>
          </div>
        </div>
      )}

      {/* Stripe setup warning */}
      {hasActiveSubscription && !stripeReady && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">
              {t("stripeSetupWarning.title")}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {status.connected
                ? t("stripeSetupWarning.descriptionIncomplete", {
                    plan:
                      subscription?.plan?.displayName ??
                      t("stripeSetupWarning.planFallback"),
                  })
                : t("stripeSetupWarning.descriptionDisconnected", {
                    plan:
                      subscription?.plan?.displayName ??
                      t("stripeSetupWarning.planFallback"),
                  })}
            </p>
          </div>
        </div>
      )}

      {/* Stripe Connect card */}
      <div className="bg-white rounded-xl border border-border-custom overflow-hidden">
        <div className="p-6 border-b border-border-custom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t("stripeConnect.title")}
              </h2>
              <p className="text-sm text-text-secondary">
                {t("stripeConnect.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status indicators */}
          <div className="space-y-3 mb-6">
            <StatusItem
              label={t("stripeConnect.accountConnected")}
              isComplete={status.connected}
            />
            <StatusItem
              label={t("stripeConnect.chargesEnabled")}
              isComplete={status.chargesEnabled || false}
              disabled={!status.connected}
            />
            <StatusItem
              label={t("stripeConnect.detailsSubmitted")}
              isComplete={status.detailsSubmitted || false}
              disabled={!status.connected}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleConnectStripe}
              disabled={isConnecting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isConnecting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {status.connected
                ? stripeReady
                  ? t("stripeConnect.updateSettings")
                  : t("stripeConnect.completeSetup")
                : t("stripeConnect.connect")}
            </Button>
            {status.connected && (
              <Button
                variant="outline"
                onClick={handleOpenStripe}
                disabled={isOpeningStripe}
                className="border-border-custom hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
              >
                {isOpeningStripe && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("stripeConnect.openDashboard")}
              </Button>
            )}
          </div>

          {/* Account ID */}
          {status.connected && status.accountId && (
            <p className="mt-4 text-xs text-text-secondary hidden">
              {t("stripeConnect.accountId")}:{" "}
              <code className="bg-surface px-1.5 py-0.5 rounded text-text-primary">
                {status.accountId}
              </code>
            </p>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-surface rounded-xl border border-border-custom p-6">
        <h3 className="font-semibold text-text-primary mb-2">
          {t("howItWorks.title")}
        </h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            {t("howItWorks.step1")}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            {t("howItWorks.step2")}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            {t("howItWorks.step3")}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            {t("howItWorks.step4")}
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  isComplete,
  disabled = false,
}: {
  label: string;
  isComplete: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {isComplete ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <div
          className={`w-5 h-5 rounded-full border-2 ${
            disabled ? "border-gray-200" : "border-border-custom"
          }`}
        />
      )}
      <span
        className={`text-sm ${
          disabled
            ? "text-gray-400"
            : isComplete
              ? "text-text-primary"
              : "text-text-secondary"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
