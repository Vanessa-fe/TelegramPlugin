"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import type {
  SubscriptionStatus,
  SubscriptionWithRelations,
} from "@/types/subscription";
import { Eye, Filter, Megaphone, Search, UserCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<SubscriptionStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50",
  PAST_DUE: "text-orange-600 bg-orange-50",
  CANCELED: "text-gray-600 bg-gray-50",
  INCOMPLETE: "text-yellow-600 bg-yellow-50",
  TRIALING: "text-blue-600 bg-blue-50",
  EXPIRED: "text-red-600 bg-red-50",
};

const statusIcons: Record<SubscriptionStatus, string> = {
  ACTIVE: "●",
  PAST_DUE: "⚠",
  CANCELED: "✕",
  INCOMPLETE: "◔",
  TRIALING: "🕐",
  EXPIRED: "✕",
};

function getTrialDaysLeft(
  trialEndsAt: string | null | undefined
): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diffDays = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays > 0 ? diffDays : null;
}

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");
  const locale = useLocale();

  const [subscriptions, setSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<SubscriptionStatus | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // i18n: labels & intervals
  const statusLabels: Record<SubscriptionStatus, string> = useMemo(
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

  const intervalLabels: Record<string, string> = useMemo(
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

  function formatPrice(cents: number, currency: string): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return t("relativeDate.today");
    if (diffDays === 1) return t("relativeDate.yesterday");
    if (diffDays < 7) return t("relativeDate.daysAgo", { count: diffDays });

    // Exemple: "30 jan." / "Jan 30"
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  useEffect(() => {
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSubscriptions() {
    try {
      const data = await subscriptionsApi.findAll();
      setSubscriptions(data);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSubscriptions = subscriptions
    .filter((sub) => filterStatus === "ALL" || sub.status === filterStatus)
    .filter((sub) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const customerName = sub.customer?.displayName?.toLowerCase() || "";
      const customerEmail = sub.customer?.email?.toLowerCase() || "";
      const planName = sub.plan?.name?.toLowerCase() || "";
      return (
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        planName.includes(query)
      );
    });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "ACTIVE").length,
    past_due: subscriptions.filter((s) => s.status === "PAST_DUE").length,
    trialing: subscriptions.filter((s) => s.status === "TRIALING").length,
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-12 text-center">
          <UserCircle className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">{t("empty.title")}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {t("empty.description")}
          </p>
          <Link href="/dashboard/promote">
            <Button className="mt-6">
              <Megaphone className="mr-2 h-4 w-4" />
              {t("empty.cta")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">{t("stats.active")}</p>
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="rounded-lg border bg-orange-50 p-4">
          <p className="text-sm text-orange-700">{t("stats.pastDue")}</p>
          <p className="text-2xl font-bold text-orange-700">{stats.past_due}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-700">{t("stats.trialing")}</p>
          <p className="text-2xl font-bold text-blue-700">{stats.trialing}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as SubscriptionStatus | "ALL")
            }
            className="rounded-md border px-3 py-2 text-sm"
            aria-label={t("filters.statusLabel")}
          >
            <option value="ALL">{t("filters.allStatuses")}</option>
            <option value="ACTIVE">{t("status.ACTIVE")}</option>
            <option value="PAST_DUE">{t("status.PAST_DUE")}</option>
            <option value="CANCELED">{t("status.CANCELED")}</option>
            <option value="TRIALING">{t("status.TRIALING")}</option>
            <option value="EXPIRED">{t("status.EXPIRED")}</option>
            <option value="INCOMPLETE">{t("status.INCOMPLETE")}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("filters.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.subscriber")}</TableHead>
              <TableHead>{t("table.offer")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.since")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-500 py-8"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => {
                const trialDays = getTrialDaysLeft(subscription.trialEndsAt);

                return (
                  <TableRow key={subscription.id}>
                    {/* Abonné */}
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-medium text-sm">
                          {(subscription.customer?.displayName ||
                            subscription.customer?.email ||
                            "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.customer?.displayName ||
                              t("table.noName")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.customer?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Offre */}
                    <TableCell>
                      <p className="font-medium">
                        {subscription.plan?.name || "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan ? (
                          <>
                            {formatPrice(
                              subscription.plan.priceCents,
                              subscription.plan.currency
                            )}
                            {intervalLabels[subscription.plan.interval] || ""}
                          </>
                        ) : (
                          "—"
                        )}
                      </p>
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium w-fit ${
                            statusColors[subscription.status]
                          }`}
                        >
                          <span>{statusIcons[subscription.status]}</span>
                          {statusLabels[subscription.status]}
                        </span>

                        {subscription.status === "TRIALING" &&
                          trialDays !== null && (
                            <span className="text-xs text-muted-foreground">
                              {t("trialDaysLeft", { count: trialDays })}
                            </span>
                          )}

                        {subscription.status === "PAST_DUE" && (
                          <Link
                            href={`/dashboard/subscriptions/${subscription.id}`}
                            className="text-xs text-orange-600 hover:underline"
                          >
                            {t("followUp")} →
                          </Link>
                        )}
                      </div>
                    </TableCell>

                    {/* Depuis */}
                    <TableCell className="text-muted-foreground">
                      {formatRelativeDate(subscription.startedAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/subscriptions/${subscription.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          {t("actions.view")}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
