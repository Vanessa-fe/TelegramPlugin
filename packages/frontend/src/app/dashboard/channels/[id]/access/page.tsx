"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { channelsApi } from "@/lib/api/channels";
import { customersApi } from "@/lib/api/customers";
import { subscriptionsApi } from "@/lib/api/subscriptions";

import {
  ChannelProvider,
  type AccessStatus,
  type Channel,
  type ChannelAccess,
} from "@/types/channel";
import type { Customer } from "@/types/customer";
import type { SubscriptionWithRelations } from "@/types/subscription";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  UserMinus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<AccessStatus, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  GRANTED: "text-green-600 bg-green-50",
  REVOKE_PENDING: "text-orange-700 bg-orange-50",
  REVOKED: "text-red-600 bg-red-50",
};

const statusIconByStatus: Record<AccessStatus, ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  GRANTED: <CheckCircle className="h-4 w-4" />,
  REVOKE_PENDING: <AlertTriangle className="h-4 w-4" />,
  REVOKED: <XCircle className="h-4 w-4" />,
};

export default function ChannelAccessManagementPage() {
  const t = useTranslations("channels");
  const locale = useLocale();

  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [accesses, setAccesses] = useState<ChannelAccess[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeSubscriptionId, setRevokeSubscriptionId] = useState<string>("");
  const [revokeReason, setRevokeReason] = useState<string>("manual");
  const [isRevoking, setIsRevoking] = useState(false);

  const statusLabels: Record<AccessStatus, string> = useMemo(
    () => ({
      PENDING: t("access.status.PENDING"),
      GRANTED: t("access.status.GRANTED"),
      REVOKE_PENDING: t("access.status.REVOKE_PENDING"),
      REVOKED: t("access.status.REVOKED"),
    }),
    [t]
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  async function loadData() {
    try {
      const [channelData, accessesData, customersData, subscriptionsData] =
        await Promise.all([
          channelsApi.findOne(channelId),
          channelsApi.getAccesses(channelId),
          customersApi.findAll(),
          subscriptionsApi.findAll(),
        ]);

      setChannel(channelData);
      setAccesses(accessesData);
      setCustomers(customersData);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("access.errors.load")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRevokeAccess() {
    if (!revokeSubscriptionId) {
      toast.error(t("access.errors.noSubscriptionSelected"));
      return;
    }

    setIsRevoking(true);
    try {
      await channelsApi.revokeAccess({
        subscriptionId: revokeSubscriptionId,
        reason: revokeReason,
      });

      toast.success(t("access.success.revoked"));
      setShowRevokeDialog(false);
      setRevokeSubscriptionId("");
      await loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("access.errors.revoke")
      );
    } finally {
      setIsRevoking(false);
    }
  }

  async function handleManualGrant(accessId: string) {
    try {
      await channelsApi.confirmManualGrant(accessId);
      toast.success(t("access.success.manualGranted"));
      await loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("access.errors.manualGrant"),
      );
    }
  }

  async function handleManualRevoke(accessId: string) {
    try {
      await channelsApi.confirmManualRevoke(accessId);
      toast.success(t("access.success.manualRevoked"));
      await loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("access.errors.manualRevoke"),
      );
    }
  }

  function getCustomerName(customerId: string): string {
    const customer = customers.find((c) => c.id === customerId);
    return (
      customer?.displayName ||
      customer?.email ||
      t("access.labels.unknownCustomer")
    );
  }

  function getSubscriptionLabel(subscriptionId: string): string {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);

    if (!subscription) {
      return `${subscriptionId.slice(0, 8)}...`;
    }

    const planName = subscription.plan?.name || subscription.id.slice(0, 8);
    return `${planName} · ${subscription.status}`;
  }

  function getSubscriptionStatus(subscriptionId: string) {
    return subscriptions.find((s) => s.id === subscriptionId)?.status;
  }

  function getRevokeReasonLabel(reason?: string | null): string {
    if (!reason) {
      return t("common.na");
    }

    const key = `access.revokeReasons.${reason}` as const;
    const translated = t(key as never);
    return translated || reason;
  }

  function openRevokeDialog(subscriptionId: string) {
    setRevokeSubscriptionId(subscriptionId);
    setShowRevokeDialog(true);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("access.loading.title")}
          </p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">
          {t("access.notFound.title")}
        </p>
        <div className="flex justify-center">
          <Link href="/dashboard/channels">
            <Button variant="outline">{t("access.notFound.back")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isWhatsApp = channel.provider === ChannelProvider.WHATSAPP;
  const pendingAccesses = accesses.filter(
    (a) =>
      a.status === "PENDING" &&
      (!isWhatsApp || getSubscriptionStatus(a.subscriptionId) === "ACTIVE"),
  );
  const revokePendingAccesses = accesses.filter(
    (a) => a.status === "REVOKE_PENDING",
  );
  const grantedCount = accesses.filter((a) => a.status === "GRANTED").length;
  const revokedCount = accesses.filter((a) => a.status === "REVOKED").length;
  const pendingCount = pendingAccesses.length;
  const revokePendingCount = revokePendingAccesses.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/channels">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {channel.title || t("labels.untitled")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("access.subtitle")}
          </p>
        </div>

      </div>

      {isWhatsApp ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("access.stats.total")}
            </p>
            <p className="text-2xl font-bold">{accesses.length}</p>
          </Card>

          <Card className="p-4 bg-amber-50">
            <p className="text-sm text-amber-700">
              {t("access.stats.pendingAdd")}
            </p>
            <p className="text-2xl font-bold text-amber-700">
              {pendingCount}
            </p>
          </Card>

          <Card className="p-4 bg-red-50">
            <p className="text-sm text-red-700">
              {t("access.stats.pendingRemove")}
            </p>
            <p className="text-2xl font-bold text-red-700">
              {revokePendingCount}
            </p>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("access.stats.total")}
            </p>
            <p className="text-2xl font-bold">{accesses.length}</p>
          </Card>

          <Card className="p-4 bg-green-50">
            <p className="text-sm text-green-700">
              {t("access.stats.granted")}
            </p>
            <p className="text-2xl font-bold text-green-700">
              {grantedCount}
            </p>
          </Card>

          <Card className="p-4 bg-red-50">
            <p className="text-sm text-red-700">
              {t("access.stats.revoked")}
            </p>
            <p className="text-2xl font-bold text-red-700">{revokedCount}</p>
          </Card>
        </div>
      )}

      {isWhatsApp && (
        <Card className="p-5 border-purple-100 bg-purple-50/40">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-9 w-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-purple-900">
                {t("access.manual.title")}
              </h2>
              <p className="text-sm text-purple-900/70">
                {t("access.manual.description")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {isWhatsApp && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {t("access.manual.toAddTitle")}
              </h2>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            </div>

            {pendingAccesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("access.manual.toAddEmpty")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("access.manual.columns.customer")}</TableHead>
                    <TableHead>
                      {t("access.manual.columns.subscription")}
                    </TableHead>
                    <TableHead>{t("access.manual.columns.requestedAt")}</TableHead>
                    <TableHead className="text-right">
                      {t("access.manual.columns.action")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAccesses.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="font-medium">
                        {getCustomerName(access.customerId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getSubscriptionLabel(access.subscriptionId)}
                      </TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "short",
                        }).format(new Date(access.createdAt))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleManualGrant(access.id)}
                        >
                          {t("access.manual.actions.confirmAdded")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-700">
                {t("access.manual.toRemoveTitle")}
              </h2>
              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">
                {revokePendingCount}
              </span>
            </div>

            {revokePendingAccesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("access.manual.toRemoveEmpty")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("access.manual.columns.customer")}</TableHead>
                    <TableHead>
                      {t("access.manual.columns.subscription")}
                    </TableHead>
                    <TableHead>{t("access.manual.columns.reason")}</TableHead>
                    <TableHead className="text-right">
                      {t("access.manual.columns.action")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revokePendingAccesses.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="font-medium">
                        {getCustomerName(access.customerId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getSubscriptionLabel(access.subscriptionId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getRevokeReasonLabel(access.revokeReason)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleManualRevoke(access.id)}
                        >
                          {t("access.manual.actions.confirmRemoved")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {isWhatsApp ? t("access.table.historyTitle") : t("access.table.title")}
        </h2>

        {accesses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t("access.table.empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("access.table.columns.customer")}</TableHead>
                <TableHead>{t("access.table.columns.status")}</TableHead>
                <TableHead>{t("access.table.columns.grantedAt")}</TableHead>
                <TableHead>{t("access.table.columns.revokedAt")}</TableHead>
                <TableHead>{t("access.table.columns.reason")}</TableHead>
                {!isWhatsApp && (
                  <TableHead className="text-right">
                    {t("access.table.columns.actions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {accesses.map((access) => (
                <TableRow key={access.id}>
                  <TableCell className="font-medium">
                    {getCustomerName(access.customerId)}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusColors[access.status]}`}
                    >
                      {statusIconByStatus[access.status]}
                      {statusLabels[access.status]}
                    </span>
                  </TableCell>

                  <TableCell>
                    {access.grantedAt
                      ? new Intl.DateTimeFormat(locale, {
                          dateStyle: "short",
                        }).format(new Date(access.grantedAt))
                      : t("common.na")}
                  </TableCell>

                  <TableCell>
                    {access.revokedAt
                      ? new Intl.DateTimeFormat(locale, {
                          dateStyle: "short",
                        }).format(new Date(access.revokedAt))
                      : t("common.na")}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {access.revokeReason || t("common.na")}
                  </TableCell>

                  {!isWhatsApp && (
                    <TableCell className="text-right">
                      {access.status === "GRANTED" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openRevokeDialog(access.subscriptionId)}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          {t("access.actions.revoke")}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Grant Access Dialog */}
      {/* Revoke Access Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("access.revokeDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("access.revokeDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">
                {t("access.revokeDialog.reasonLabel")}
              </Label>
              <Select value={revokeReason} onValueChange={setRevokeReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    {t("access.revokeReasons.manual")}
                  </SelectItem>
                  <SelectItem value="payment_failed">
                    {t("access.revokeReasons.payment_failed")}
                  </SelectItem>
                  <SelectItem value="canceled">
                    {t("access.revokeReasons.canceled")}
                  </SelectItem>
                  <SelectItem value="refund">
                    {t("access.revokeReasons.refund")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevokeDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAccess}
              disabled={isRevoking}
            >
              {isRevoking
                ? t("common.processing")
                : t("access.revokeDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
