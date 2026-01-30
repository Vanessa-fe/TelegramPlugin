"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { channelsApi } from "@/lib/api/channels";
import { entitlementsApi } from "@/lib/api/entitlements";
import type { Channel } from "@/types/channel";
import type {
  EntitlementType,
  EntitlementWithRelations,
} from "@/types/entitlement";
import { Filter, Key, Lock, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AccessStatus = "active" | "suspended" | "revoked" | "expired";

const statusConfig: Record<
  AccessStatus,
  { label: string; color: string; icon: string }
> = {
  active: { label: "Actif", color: "text-green-600 bg-green-50", icon: "●" },
  suspended: {
    label: "Suspendu",
    color: "text-orange-600 bg-orange-50",
    icon: "⚠",
  },
  revoked: { label: "Révoqué", color: "text-gray-600 bg-gray-50", icon: "✕" },
  expired: { label: "Expiré", color: "text-red-600 bg-red-50", icon: "✕" },
};

const typeLabels: Record<EntitlementType, string> = {
  CHANNEL_ACCESS: "Accès canal",
  FEATURE_FLAG: "Fonctionnalité",
  CONTENT_UNLOCK: "Contenu débloqué",
  API_QUOTA: "Quota API",
};

function getAccessStatus(entitlement: EntitlementWithRelations): AccessStatus {
  if (entitlement.revokedAt) return "revoked";
  if (entitlement.expiresAt && new Date(entitlement.expiresAt) < new Date())
    return "expired";
  if (entitlement.subscription?.status === "PAST_DUE") return "suspended";
  return "active";
}

export default function AccessPage() {
  const locale = useLocale();
  const [entitlements, setEntitlements] = useState<EntitlementWithRelations[]>(
    []
  );
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AccessStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("access");

  // Create a map of channel IDs to channel info
  const channelMap = useMemo(() => {
    const map = new Map<string, Channel>();
    channels.forEach((ch) => map.set(ch.id, ch));
    return map;
  }, [channels]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [entData, chData] = await Promise.all([
        entitlementsApi.findAll(),
        channelsApi.findAll(),
      ]);
      setEntitlements(entData);
      setChannels(chData);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  // Compute status for each entitlement
  const entitlementsWithStatus = useMemo(() => {
    return entitlements.map((e) => ({
      ...e,
      computedStatus: getAccessStatus(e),
    }));
  }, [entitlements]);

  // Filter entitlements
  const filteredEntitlements = useMemo(() => {
    return entitlementsWithStatus
      .filter(
        (e) => filterStatus === "ALL" || e.computedStatus === filterStatus
      )
      .filter((e) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const customerName = e.customer?.displayName?.toLowerCase() || "";
        const channel = e.resourceId ? channelMap.get(e.resourceId) : null;
        const channelName = channel?.title?.toLowerCase() || "";
        return customerName.includes(query) || channelName.includes(query);
      });
  }, [entitlementsWithStatus, filterStatus, searchQuery, channelMap]);

  // Stats
  const stats = useMemo(
    () => ({
      total: entitlements.length,
      active: entitlementsWithStatus.filter(
        (e) => e.computedStatus === "active"
      ).length,
      revoked: entitlementsWithStatus.filter(
        (e) => e.computedStatus === "revoked"
      ).length,
    }),
    [entitlements.length, entitlementsWithStatus]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (entitlements.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-12 text-center">
          <Key className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">{t("empty.title")}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {t("empty.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">{t("stats.active")}</p>
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-sm text-gray-700">{t("stats.revoked")}</p>
          <p className="text-2xl font-bold text-gray-700">{stats.revoked}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as AccessStatus | "ALL")
            }
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="ALL">{t("filters.allStatuses")}</option>
            <option value="active">{t("filters.active")}</option>
            <option value="suspended">{t("filters.suspended")}</option>
            <option value="revoked">{t("filters.revoked")}</option>
            <option value="expired">{t("filters.expired")}</option>
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
              <TableHead>{t("table.channel")}</TableHead>
              <TableHead>{t("table.via")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntitlements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-500 py-8"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              filteredEntitlements.map((entitlement) => {
                const status = statusConfig[entitlement.computedStatus];
                const channel = entitlement.resourceId
                  ? channelMap.get(entitlement.resourceId)
                  : null;
                const isChannelAccess = entitlement.type === "CHANNEL_ACCESS";

                return (
                  <TableRow key={entitlement.id}>
                    {/* Abonné */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-medium text-sm">
                          {(entitlement.customer?.displayName ||
                            entitlement.customer?.email ||
                            "?")[0].toUpperCase()}
                        </div>
                        <span className="font-medium">
                          {entitlement.customer?.displayName ||
                            t("table.noName")}
                        </span>
                      </div>
                    </TableCell>

                    {/* Canal */}
                    <TableCell>
                      {isChannelAccess && channel ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{channel.title}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {typeLabels[entitlement.type]}
                        </span>
                      )}
                    </TableCell>

                    {/* Via */}
                    <TableCell>
                      {entitlement.subscription?.plan ? (
                        <div>
                          <p className="font-medium">
                            {entitlement.subscription.plan.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Intl.NumberFormat(locale, {
                              style: "currency",
                              currency: entitlement.subscription.plan.currency,
                            }).format(
                              entitlement.subscription.plan.priceCents / 100
                            )}
                            /
                            {entitlement.subscription.plan.interval === "MONTH"
                              ? "mois"
                              : entitlement.subscription.plan.interval.toLowerCase()}
                          </p>
                        </div>
                      ) : entitlement.revokeReason ? (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t("manualAccess")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entitlement.revokeReason === "payment_failed" &&
                              "Paiement échoué"}
                            {entitlement.revokeReason === "canceled" &&
                              "Annulé"}
                            {entitlement.revokeReason === "refund" &&
                              "Remboursé"}
                            {entitlement.revokeReason === "manual" &&
                              "Révocation manuelle"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.color}`}
                      >
                        <span>{status.icon}</span>
                        {status.label}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {entitlement.computedStatus === "active" &&
                      isChannelAccess &&
                      channel ? (
                        <Link href={`/dashboard/channels/${channel.id}/access`}>
                          <Button variant="ghost" size="sm">
                            {t("table.manage")}
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
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
