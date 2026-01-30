"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { channelsApi } from "@/lib/api/channels";
import { customersApi } from "@/lib/api/customers";
import { subscriptionsApi } from "@/lib/api/subscriptions";

import type { AccessStatus, Channel, ChannelAccess } from "@/types/channel";
import type { Customer } from "@/types/customer";
import type { Subscription } from "@/types/subscription";

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
  ArrowLeft,
  CheckCircle,
  Clock,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<AccessStatus, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  GRANTED: "text-green-600 bg-green-50",
  REVOKED: "text-red-600 bg-red-50",
};

const statusIconByStatus: Record<AccessStatus, ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  GRANTED: <CheckCircle className="h-4 w-4" />,
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] =
    useState<string>("");
  const [isGranting, setIsGranting] = useState(false);

  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeSubscriptionId, setRevokeSubscriptionId] = useState<string>("");
  const [revokeReason, setRevokeReason] = useState<string>("manual");
  const [isRevoking, setIsRevoking] = useState(false);

  const statusLabels: Record<AccessStatus, string> = useMemo(
    () => ({
      PENDING: t("access.status.PENDING"),
      GRANTED: t("access.status.GRANTED"),
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

  async function handleGrantAccess() {
    if (!selectedCustomerId || !selectedSubscriptionId) {
      toast.error(t("access.errors.missingSelection"));
      return;
    }

    setIsGranting(true);
    try {
      await channelsApi.grantAccess({
        customerId: selectedCustomerId,
        subscriptionId: selectedSubscriptionId,
        channelId,
      });

      toast.success(t("access.success.granted"));
      setShowGrantDialog(false);
      setSelectedCustomerId("");
      setSelectedSubscriptionId("");
      await loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("access.errors.grant")
      );
    } finally {
      setIsGranting(false);
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

  function getCustomerName(customerId: string): string {
    const customer = customers.find((c) => c.id === customerId);
    return (
      customer?.displayName ||
      customer?.email ||
      t("access.labels.unknownCustomer")
    );
  }

  function openRevokeDialog(subscriptionId: string) {
    setRevokeSubscriptionId(subscriptionId);
    setShowRevokeDialog(true);
  }

  const customerSubscriptions = selectedCustomerId
    ? subscriptions.filter(
        (s) => s.customerId === selectedCustomerId && s.status === "ACTIVE"
      )
    : [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("access.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">{t("access.notFound")}</p>
        <div className="flex justify-center">
          <Link href="/dashboard/channels">
            <Button variant="outline">{t("access.backToChannels")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const grantedCount = accesses.filter((a) => a.status === "GRANTED").length;
  const revokedCount = accesses.filter((a) => a.status === "REVOKED").length;

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

        <Button onClick={() => setShowGrantDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("access.actions.grant")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            {t("access.stats.total")}
          </p>
          <p className="text-2xl font-bold">{accesses.length}</p>
        </Card>

        <Card className="p-4 bg-green-50">
          <p className="text-sm text-green-700">{t("access.stats.granted")}</p>
          <p className="text-2xl font-bold text-green-700">{grantedCount}</p>
        </Card>

        <Card className="p-4 bg-red-50">
          <p className="text-sm text-red-700">{t("access.stats.revoked")}</p>
          <p className="text-2xl font-bold text-red-700">{revokedCount}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {t("access.table.title")}
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
                <TableHead className="text-right">
                  {t("access.table.columns.actions")}
                </TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Grant Access Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("access.grantDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("access.grantDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">
                {t("access.grantDialog.customerLabel")}
              </Label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("access.grantDialog.customerPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.displayName || customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerId && (
              <div>
                <Label htmlFor="subscription">
                  {t("access.grantDialog.subscriptionLabel")}
                </Label>
                <Select
                  value={selectedSubscriptionId}
                  onValueChange={setSelectedSubscriptionId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "access.grantDialog.subscriptionPlaceholder"
                      )}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {customerSubscriptions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t("access.grantDialog.noActiveSubscription")}
                      </SelectItem>
                    ) : (
                      customerSubscriptions.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.id.slice(0, 8)}... - {sub.status}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleGrantAccess} disabled={isGranting}>
              {isGranting
                ? t("common.processing")
                : t("access.grantDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
