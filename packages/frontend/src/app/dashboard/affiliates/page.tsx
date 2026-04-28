"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { affiliatesApi } from "@/lib/api/affiliates";
import { getAffiliateDisplayLabel, getVisibleAffiliateEmail } from "@/lib/affiliate-utils";
import type { Affiliate, AffiliateStats, AffiliateStatus, ConversionStatus } from "@/types/affiliate";
import { MoreHorizontal, Plus, Users, Coins, Settings, MousePointerClick, TrendingUp, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const statusClassNames: Record<AffiliateStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  DEACTIVATED: "bg-gray-100 text-gray-500",
};

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("affiliates");
  const locale = useLocale();

  const statusLabels: Record<AffiliateStatus, string> = {
    PENDING: t("statusLabels.PENDING"),
    ACTIVE: t("statusLabels.ACTIVE"),
    SUSPENDED: t("statusLabels.SUSPENDED"),
    DEACTIVATED: t("statusLabels.DEACTIVATED"),
  };

  const _conversionStatusLabels: Record<ConversionStatus, string> = {
    PENDING: t("conversionStatusLabels.PENDING"),
    APPROVED: t("conversionStatusLabels.APPROVED"),
    CANCELLED: t("conversionStatusLabels.CANCELLED"),
    PAID: t("conversionStatusLabels.PAID"),
  };

  const loadData = useCallback(async () => {
    try {
      const [affiliatesData, statsData] = await Promise.all([
        affiliatesApi.findAll(),
        affiliatesApi.getOrganizationStats(),
      ]);
      setAffiliates(affiliatesData);
      setStats(statsData);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeactivate(id: string) {
    try {
      await affiliatesApi.deactivate(id);
      toast.success(t("toast.deactivateSuccess"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.deactivateError"));
    }
  }

  function formatCurrency(cents: number, currency: string = "EUR") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(cents / 100);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-text-secondary">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/affiliates/program">
            <Button variant="outline" className="border-border-custom">
              <Settings className="mr-2 h-4 w-4" />
              {t("program.settings")}
            </Button>
          </Link>
          <Link href="/dashboard/affiliates/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              {t("create")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border-custom p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t("stats.clicks")}</p>
                <p className="text-xl font-bold text-text-primary">
                  {stats.totalClicks.toLocaleString(locale)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border-custom p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t("stats.conversions")}</p>
                <p className="text-xl font-bold text-text-primary">
                  {stats.totalConversions.toLocaleString(locale)}
                </p>
                {stats.conversionRate > 0 && (
                  <p className="text-xs text-text-secondary">
                    {stats.conversionRate}% {t("stats.conversionRate")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border-custom p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t("stats.pending")}</p>
                <p className="text-xl font-bold text-text-primary">
                  {formatCurrency(stats.pendingCommissions)}
                </p>
                <p className="text-xs text-text-secondary">
                  {stats.pendingConversions} {t("stats.conversionsCount")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border-custom p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t("stats.total")}</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.totalCommissions)}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatCurrency(stats.paidCommissions)} {t("stats.paid")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliates list */}
      {affiliates.length === 0 ? (
        <div className="bg-white rounded-xl border-border-custom p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {t("empty.title")}
          </h3>
          <p className="text-text-secondary mb-6 max-w-sm mx-auto">
            {t("empty.description")}
          </p>
          <Link href="/dashboard/affiliates/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              {t("empty.cta")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border-custom overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-custom bg-surface">
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.affiliate")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.code")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.commission")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.earnings")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.status")}
                </th>
                <th className="text-right text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => {
                const visibleEmail = getVisibleAffiliateEmail(affiliate.email);
                const primaryLabel = getAffiliateDisplayLabel(affiliate);

                return (
                <tr
                  key={affiliate.id}
                  className="border-b border-border-custom last:border-0 hover:bg-surface transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-text-primary">
                        {primaryLabel}
                      </p>
                      {affiliate.name && visibleEmail && (
                        <p className="text-sm text-text-secondary">
                          {visibleEmail}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {affiliate.referralCode}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium">{affiliate.commissionRate}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(affiliate.totalEarnings)}
                      </span>
                      {affiliate.pendingEarnings > 0 && (
                        <span className="text-xs text-text-secondary">
                          {formatCurrency(affiliate.pendingEarnings)} {t("table.pending")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassNames[affiliate.status]}`}
                    >
                      {statusLabels[affiliate.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/affiliates/${affiliate.id}/payouts`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border-custom hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                        >
                          <Coins className="mr-2 h-4 w-4" />
                          {t("table.payouts")}
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-purple-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/affiliates/${affiliate.id}`}>
                              {t("actions.view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/affiliates/${affiliate.id}/edit`}>
                              {t("actions.edit")}
                            </Link>
                          </DropdownMenuItem>
                          {affiliate.status !== "DEACTIVATED" && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeactivate(affiliate.id)}
                            >
                              {t("actions.deactivate")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
