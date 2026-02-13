"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import { platformSubscriptionApi } from "@/lib/api/platform-subscription";
import type {
  PlatformPlan,
  PlatformPlanName,
  PlatformSubscription,
  PlatformSubscriptionStatus,
} from "@/types/platform-subscription";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const PLAN_NAMES: PlatformPlanName[] = ["starter", "growth", "pro"];

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function extractBrandingSettings(metadata: Record<string, unknown> | null): {
  logoUrl: string;
  hideSublynkBranding: boolean;
} {
  const branding = toRecord(metadata?.branding);
  const logoUrl =
    typeof branding.logoUrl === "string" ? branding.logoUrl.trim() : "";
  const hideSublynkBranding = branding.hideSublynkBranding === true;
  return { logoUrl, hideSublynkBranding };
}

export default function PlatformSubscriptionPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations("platformSubscriptionPage");

  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [organizationMetadata, setOrganizationMetadata] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [hideSublynkBranding, setHideSublynkBranding] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [subscriptionData, plansData, organizationData] = await Promise.all([
        platformSubscriptionApi.getSubscription(),
        platformSubscriptionApi.getPlans(),
        user?.organizationId
          ? organizationsApi.findOne(user.organizationId)
          : Promise.resolve(null),
      ]);

      setSubscription(subscriptionData);
      setPlans(
        PLAN_NAMES.map((name) => plansData.find((plan) => plan.name === name))
          .filter(Boolean)
          .map((plan) => plan as PlatformPlan),
      );

      if (organizationData) {
        const metadata = toRecord(organizationData.metadata);
        setOrganizationMetadata(metadata);
        const branding = extractBrandingSettings(metadata);
        setLogoUrl(branding.logoUrl);
        setHideSublynkBranding(branding.hideSublynkBranding);
      } else {
        setOrganizationMetadata(null);
        setLogoUrl("");
        setHideSublynkBranding(false);
      }
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toasts.loadError"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t, user?.organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasActiveOrTrialingSubscription =
    subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  const isStarterActive =
    hasActiveOrTrialingSubscription && subscription?.plan?.name === "starter";

  const canCheckoutPlan = useCallback(
    (planName: PlatformPlanName) => {
      if (!hasActiveOrTrialingSubscription) {
        return true;
      }
      if (isStarterActive && planName !== "starter") {
        return true;
      }
      return false;
    },
    [hasActiveOrTrialingSubscription, isStarterActive],
  );

  const brandingEligible =
    subscription?.plan?.name === "pro" &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING");

  function getStatusLabel(status: PlatformSubscriptionStatus): string {
    return t(`status.${status}`);
  }

  function getPlanConfig(planName: PlatformPlanName) {
    return {
      commission: t(`plans.planDetails.${planName}.commission`),
      features: [t(`plans.planDetails.${planName}.feature1`)],
    };
  }

  async function handleCheckout(planName: PlatformPlanName) {
    try {
      setIsProcessing(planName);
      const { url } = await platformSubscriptionApi.createCheckout(planName);
      window.location.href = url;
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toasts.checkoutError"),
      );
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleOpenPortal() {
    try {
      setIsProcessing("portal");
      const { url } = await platformSubscriptionApi.createPortal();
      window.location.href = url;
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toasts.portalError"));
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleSaveBranding() {
    if (!user?.organizationId) {
      toast.error(t("toasts.organizationMissing"));
      return;
    }

    try {
      setIsSavingBranding(true);

      const currentMetadata = organizationMetadata ?? {};
      const currentBranding = toRecord(currentMetadata.branding);
      const normalizedLogoUrl = logoUrl.trim();
      const nextBranding: Record<string, unknown> = {
        ...currentBranding,
        logoUrl: normalizedLogoUrl.length > 0 ? normalizedLogoUrl : null,
        hideSublynkBranding: brandingEligible ? hideSublynkBranding : false,
      };
      const nextMetadata: Record<string, unknown> = {
        ...currentMetadata,
        branding: nextBranding,
      };

      await organizationsApi.update(user.organizationId, {
        metadata: nextMetadata,
      });
      setOrganizationMetadata(nextMetadata);
      if (!brandingEligible) {
        setHideSublynkBranding(false);
      }
      toast.success(t("toasts.brandingSaved"));
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message ||
          t("toasts.brandingSaveError"),
      );
    } finally {
      setIsSavingBranding(false);
    }
  }

  function formatPrice(priceCents: number, currency: string) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(priceCents / 100);
  }

  function formatDate(date?: string | null) {
    if (!date) return t("common.notAvailable");
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(date));
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
          {t("header.title")}
        </h1>
        <p className="mt-1 text-text-secondary">{t("header.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border-custom bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("currentPlan.title")}
        </h2>

        {subscription?.plan ? (
          <div className="mt-4 space-y-3">
            <p className="text-text-primary">
              <span className="font-semibold">{subscription.plan.displayName}</span>
              <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                {getStatusLabel(subscription.status)}
              </span>
            </p>
            <p className="text-sm text-text-secondary">
              {t("currentPlan.priceLabel", {
                price: formatPrice(
                  subscription.plan.priceCents,
                  subscription.plan.currency,
                ),
                period: t("plans.perMonth"),
              })}
            </p>
            {(subscription.plan.name === "starter" ||
              subscription.plan.name === "growth" ||
              subscription.plan.name === "pro") && (
              <p className="text-sm text-purple-700">
                {getPlanConfig(subscription.plan.name).commission}
              </p>
            )}
            <p className="text-sm text-text-secondary">
              {t("currentPlan.periodLabel", {
                start: formatDate(subscription.currentPeriodStart),
                end: formatDate(subscription.currentPeriodEnd),
              })}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {subscription.stripeSubscriptionId && !subscription.isGrandfathered ? (
                <Button
                  onClick={handleOpenPortal}
                  disabled={isProcessing === "portal"}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isProcessing === "portal" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t("currentPlan.manageStripe")}
                </Button>
              ) : (
                <p className="text-sm text-text-secondary">
                  {t("currentPlan.managementUnavailable")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-text-secondary">{t("currentPlan.none")}</p>
        )}
      </div>

      <div className="rounded-xl border border-border-custom bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("plans.title")}
        </h2>

        {hasActiveOrTrialingSubscription && !isStarterActive && (
          <p className="mt-2 text-sm text-text-secondary">
            {t("plans.activeLockedHint")}
          </p>
        )}
        {isStarterActive && (
          <p className="mt-2 text-sm text-text-secondary">
            {t("plans.starterUpgradeHint")}
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-border-custom p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-text-primary">{plan.displayName}</p>
                {plan.name === "growth" ? (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                    {t("plans.recommended")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xl font-bold text-text-primary">
                {formatPrice(plan.priceCents, plan.currency)}
                <span className="ml-1 text-sm font-normal text-text-secondary">
                  {t("plans.perMonth")}
                </span>
              </p>
              {(plan.name === "starter" ||
                plan.name === "growth" ||
                plan.name === "pro") && (
                <p className="mt-1 text-sm font-medium text-purple-700">
                  {getPlanConfig(plan.name).commission}
                </p>
              )}

              {plan.trialPeriodDays ? (
                <p className="mt-1 text-xs text-green-600">
                  {t("plans.trialDays", { count: plan.trialPeriodDays })}
                </p>
              ) : null}

              {(plan.name === "starter" ||
                plan.name === "growth" ||
                plan.name === "pro") && (
                <ul className="mt-3 space-y-1 text-sm text-text-secondary">
                  {getPlanConfig(plan.name).features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              )}

              <Button
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={
                  !canCheckoutPlan(plan.name as PlatformPlanName) ||
                  isProcessing === plan.name
                }
                onClick={() => handleCheckout(plan.name as PlatformPlanName)}
              >
                {isProcessing === plan.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("plans.redirecting")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t("plans.choose")}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border-custom bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("branding.title")}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">{t("branding.subtitle")}</p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="brandLogoUrl"
              className="text-sm font-medium text-text-primary"
            >
              {t("branding.logoUrlLabel")}
            </label>
            <Input
              id="brandLogoUrl"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder={t("branding.logoUrlPlaceholder")}
            />
            <p className="text-xs text-text-secondary">
              {t("branding.logoUrlHelp")}
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border-custom p-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-custom text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
              checked={hideSublynkBranding}
              onChange={(event) => setHideSublynkBranding(event.target.checked)}
              disabled={!brandingEligible}
            />
            <span className="text-sm text-text-primary">
              {t("branding.hideSublynk")}
            </span>
          </label>

          {!brandingEligible ? (
            <p className="text-xs text-text-secondary">
              {t("branding.proOnlyHint")}
            </p>
          ) : null}

          <div className="pt-1">
            <Button
              onClick={handleSaveBranding}
              disabled={isSavingBranding}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSavingBranding && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("branding.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
