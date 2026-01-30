"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customersApi } from "@/lib/api/customers";
import { entitlementsApi } from "@/lib/api/entitlements";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import type { Customer } from "@/types/customer";
import type { Entitlement } from "@/types/entitlement";
import { EntitlementType } from "@/types/entitlement";
import type { Subscription, SubscriptionStatus } from "@/types/subscription";
import { ArrowLeft, AtSign, Calendar, Mail, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const statusColors: Record<SubscriptionStatus, string> = {
  ACTIVE: "text-green-600 bg-green-50",
  PAST_DUE: "text-orange-600 bg-orange-50",
  CANCELED: "text-gray-600 bg-gray-50",
  INCOMPLETE: "text-yellow-600 bg-yellow-50",
  TRIALING: "text-blue-600 bg-blue-50",
  EXPIRED: "text-red-600 bg-red-50",
};

export default function CustomerDetailPage() {
  const t = useTranslations("customers.detail");
  const tCustomers = useTranslations("customers");
  const locale = useLocale();
  const router = useRouter();

  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusLabels: Record<SubscriptionStatus, string> = {
    ACTIVE: t("status.ACTIVE"),
    PAST_DUE: t("status.PAST_DUE"),
    CANCELED: t("status.CANCELED"),
    INCOMPLETE: t("status.INCOMPLETE"),
    TRIALING: t("status.TRIALING"),
    EXPIRED: t("status.EXPIRED"),
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function loadData() {
    try {
      const [customerData, allSubscriptions, activeEntitlements] =
        await Promise.all([
          customersApi.findOne(customerId),
          subscriptionsApi.findAll(),
          entitlementsApi.getActiveEntitlements(customerId),
        ]);

      setCustomer(customerData);

      const customerSubs = allSubscriptions.filter(
        (sub) => sub.customerId === customerId
      );
      setSubscriptions(customerSubs);
      setEntitlements(activeEntitlements);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || tCustomers("error"));
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(dateStr)
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            {tCustomers("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">{t("notFound")}</p>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            {t("back")}
          </Button>
        </div>
      </div>
    );
  }

  const displayName = customer.displayName || customer.email || t("noName");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t("info")}</h2>
          <div className="space-y-3">
            {customer.displayName && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{customer.displayName}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.telegramUsername && (
              <div className="flex items-center gap-3 text-sm">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">@{customer.telegramUsername}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {t("createdAt")} {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t("stats")}</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("activeSubscriptions")}
              </span>
              <span className="font-medium">
                {subscriptions.filter((s) => s.status === "ACTIVE").length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("totalSubscriptions")}
              </span>
              <span className="font-medium">{subscriptions.length}</span>
            </div>
            {customer.externalId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("externalId")}</span>
                <span className="font-mono text-xs">{customer.externalId}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("entitlements")}</h2>
          <Link href="/dashboard/access">
            <Button variant="outline" size="sm">
              {t("viewAll")}
            </Button>
          </Link>
        </div>

        {entitlements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t("noEntitlements")}
          </p>
        ) : (
          <div className="space-y-2">
            {entitlements.map((entitlement) => (
              <div
                key={entitlement.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {entitlement.entitlementKey}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        entitlement.type === EntitlementType.CHANNEL_ACCESS
                          ? "bg-blue-100 text-blue-800"
                          : entitlement.type === EntitlementType.FEATURE_FLAG
                            ? "bg-purple-100 text-purple-800"
                            : entitlement.type ===
                                EntitlementType.CONTENT_UNLOCK
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {entitlement.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("grantedAt")} {formatDate(entitlement.grantedAt)}
                    {entitlement.expiresAt && (
                      <>
                        {" "}
                        • {t("expiresAt")} {formatDate(entitlement.expiresAt)}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {t("subscriptionsTitle")}
        </h2>
        {subscriptions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t("noSubscriptions")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{tCustomers("table.subscriptions")}</TableHead>
                <TableHead>{tCustomers("table.since")}</TableHead>
                <TableHead>{t("expiresAt")}</TableHead>
                <TableHead className="text-right">
                  {tCustomers("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-mono text-xs">
                    {subscription.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        statusColors[subscription.status]
                      }`}
                    >
                      {statusLabels[subscription.status]}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(subscription.startedAt)}</TableCell>
                  <TableCell>
                    {subscription.currentPeriodEnd
                      ? formatDate(subscription.currentPeriodEnd)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/subscriptions/${subscription.id}`}>
                      <Button variant="ghost" size="sm">
                        {tCustomers("table.actions")}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
