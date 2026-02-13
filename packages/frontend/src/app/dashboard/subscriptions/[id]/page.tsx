"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { subscriptionsApi } from "@/lib/api/subscriptions";
import { entitlementsApi } from "@/lib/api/entitlements";
import type {
  SubscriptionStatus,
  SubscriptionWithRelations,
} from "@/types/subscription";
import type { Entitlement } from "@/types/entitlement";

// Check if string is a valid UUID format
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  User,
  AtSign,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
} from "lucide-react";

const statusColors: Record<SubscriptionStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50",
  PAST_DUE: "text-orange-600 bg-orange-50",
  CANCELED: "text-gray-600 bg-gray-50",
  INCOMPLETE: "text-yellow-600 bg-yellow-50",
  TRIALING: "text-blue-600 bg-blue-50",
  EXPIRED: "text-red-600 bg-red-50",
};

const statusIcons: Record<SubscriptionStatus, typeof CheckCircle> = {
  ACTIVE: CheckCircle,
  PAST_DUE: AlertTriangle,
  CANCELED: XCircle,
  INCOMPLETE: Clock,
  TRIALING: Clock,
  EXPIRED: XCircle,
};

export default function SubscriptionDetailPage() {
  const t = useTranslations("subscriptionDetail");
  const locale = useLocale();
  const router = useRouter();

  const params = useParams();
  const slug = params.id as string;

  const [subscription, setSubscription] =
    useState<SubscriptionWithRelations | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadData() {
    try {
      let subscriptionData: SubscriptionWithRelations | null = null;

      if (isUUID(slug)) {
        // Direct lookup by UUID (backward compatibility)
        subscriptionData = await subscriptionsApi.findOne(slug);
      } else {
        // Lookup by friendly slug
        subscriptionData = await subscriptionsApi.findBySlug(slug);
      }

      if (!subscriptionData) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      setSubscription(subscriptionData);

      // Load entitlements for this subscription
      const entData = await entitlementsApi.findAll({
        subscriptionId: subscriptionData.id,
      });
      setEntitlements(entData);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("errors.load"));
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return t("common.na");
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
      new Date(dateStr)
    );
  }

  function formatPrice(cents: number, currency: string): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  const statusLabels = useMemo(
    () => ({
      ACTIVE: t("status.ACTIVE"),
      PAST_DUE: t("status.PAST_DUE"),
      CANCELED: t("status.CANCELED"),
      INCOMPLETE: t("status.INCOMPLETE"),
      TRIALING: t("status.TRIALING"),
      EXPIRED: t("status.EXPIRED"),
    }),
    [t]
  );

  const intervalLabels = useMemo(
    () => ({
      ONE_TIME: t("interval.ONE_TIME"),
      DAY: t("interval.DAY"),
      WEEK: t("interval.WEEK"),
      MONTH: t("interval.MONTH"),
      QUARTER: t("interval.QUARTER"),
      YEAR: t("interval.YEAR"),
    }),
    [t]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">{t("errors.load")}</p>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            {t("actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[subscription.status];
  const customerName =
    subscription.customer?.displayName ||
    subscription.customer?.email ||
    t("customer.noName");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{customerName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            statusColors[subscription.status]
          }`}
        >
          <StatusIcon className="h-4 w-4" />
          {statusLabels[subscription.status]}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscriber Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              {t("sections.subscriber")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscription.customer?.displayName && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{subscription.customer.displayName}</span>
              </div>
            )}
            {subscription.customer?.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{subscription.customer.email}</span>
              </div>
            )}
            {subscription.customer?.telegramUsername && (
              <div className="flex items-center gap-3 text-sm">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">
                  @{subscription.customer.telegramUsername}
                </span>
              </div>
            )}
            <div className="pt-2">
              <Link href={`/dashboard/customers/${subscription.customerId}`}>
                <Button variant="outline" size="sm">
                  {t("actions.viewProfile")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Offer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              {t("sections.offer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscription.plan ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{subscription.plan.name}</span>
                  <span className="text-lg font-bold">
                    {formatPrice(
                      subscription.plan.priceCents,
                      subscription.plan.currency
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {intervalLabels[
                    subscription.plan.interval as keyof typeof intervalLabels
                  ] || subscription.plan.interval}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">{t("plan.noPlan")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            {t("sections.subscriptionStatus")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t("billing.since", { date: "" }).replace("{date}", "")}
              </p>
              <p className="mt-1 font-medium">
                {formatDate(subscription.startedAt)}
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t("billing.nextCharge")}
              </p>
              <p className="mt-1 font-medium">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>

            {subscription.trialEndsAt && (
              <div className="rounded-lg border p-3 bg-blue-50">
                <p className="text-xs text-blue-700 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t("trial.ends")}
                </p>
                <p className="mt-1 font-medium text-blue-700">
                  {formatDate(subscription.trialEndsAt)}
                </p>
              </div>
            )}

            {subscription.canceledAt && (
              <div className="rounded-lg border p-3 bg-gray-50">
                <p className="text-xs text-gray-700 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {t("canceled.message", { date: "" }).replace("{date}", "")}
                </p>
                <p className="mt-1 font-medium text-gray-700">
                  {formatDate(subscription.canceledAt)}
                </p>
              </div>
            )}
          </div>

          {subscription.status === "PAST_DUE" && (
            <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3">
              <p className="text-sm text-orange-700">{t("pastDue.message")}</p>
            </div>
          )}

          {subscription.status === "INCOMPLETE" && (
            <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm text-yellow-700">
                {t("incomplete.message")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Granted Access */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            {t("sections.access")}
          </CardTitle>
          <Link href="/dashboard/access">
            <Button variant="outline" size="sm">
              {t("access.viewAll")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {entitlements.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {t("access.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {entitlements.map((entitlement) => {
                const isActive =
                  !entitlement.revokedAt &&
                  (!entitlement.expiresAt ||
                    new Date(entitlement.expiresAt) > new Date());

                return (
                  <div
                    key={entitlement.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isActive ? "bg-green-50 border-green-200" : "bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {entitlement.entitlementKey}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("access.grantedOn", {
                          date: formatDate(entitlement.grantedAt),
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {isActive ? t("access.active") : t("access.inactive")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {t("access.message")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
