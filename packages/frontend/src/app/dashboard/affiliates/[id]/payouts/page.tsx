"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { affiliatesApi } from "@/lib/api/affiliates";
import {
  PayoutStatus,
  type Affiliate,
  type AffiliatePayout,
  type CreatePayoutDto,
} from "@/types/affiliate";
import { ArrowLeft, Plus, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const statusClassNames: Record<PayoutStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const statusIcons: Record<PayoutStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  PROCESSING: <Loader2 className="h-4 w-4 animate-spin" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
};

export default function AffiliatePayoutsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("affiliates");

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newPayout, setNewPayout] = useState({
    amountCents: 0,
    method: "",
    notes: "",
  });

  const statusLabels: Record<PayoutStatus, string> = {
    PENDING: t("payouts.statusLabels.PENDING"),
    PROCESSING: t("payouts.statusLabels.PROCESSING"),
    COMPLETED: t("payouts.statusLabels.COMPLETED"),
    FAILED: t("payouts.statusLabels.FAILED"),
  };

  const loadData = useCallback(async () => {
    try {
      const id = params.id as string;
      const [affiliateData, payoutsData] = await Promise.all([
        affiliatesApi.findOne(id),
        affiliatesApi.getPayouts(id),
      ]);
      setAffiliate(affiliateData);
      setPayouts(payoutsData);
      setNewPayout((prev) => ({
        ...prev,
        amountCents: affiliateData.pendingEarnings,
      }));
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.loadError"));
      router.push("/dashboard/affiliates");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreatePayout() {
    if (!affiliate) return;
    setIsCreating(true);
    try {
      const payload: CreatePayoutDto = {
        amountCents: newPayout.amountCents,
        method: newPayout.method || undefined,
        notes: newPayout.notes || undefined,
      };
      await affiliatesApi.createPayout(affiliate.id, payload);
      toast.success(t("payouts.toast.createSuccess"));
      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("payouts.toast.createError"));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleMarkCompleted(payoutId: string) {
    try {
      await affiliatesApi.updatePayout(payoutId, { status: PayoutStatus.COMPLETED });
      toast.success(t("payouts.toast.completedSuccess"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("payouts.toast.updateError"));
    }
  }

  async function handleMarkFailed(payoutId: string) {
    try {
      await affiliatesApi.updatePayout(payoutId, { status: PayoutStatus.FAILED });
      toast.success(t("payouts.toast.failedSuccess"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("payouts.toast.updateError"));
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

  if (!affiliate) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/affiliates/${affiliate.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("payouts.back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
              {t("payouts.title")}
            </h1>
            <p className="text-text-secondary">
              {affiliate.name || affiliate.email}
            </p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={affiliate.pendingEarnings <= 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("payouts.create")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("payouts.createDialog.title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("payouts.createDialog.amount")}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={newPayout.amountCents / 100}
                    onChange={(e) =>
                      setNewPayout((prev) => ({
                        ...prev,
                        amountCents: Math.round(parseFloat(e.target.value) * 100),
                      }))
                    }
                    max={affiliate.pendingEarnings / 100}
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    EUR
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("payouts.createDialog.maxAmount", {
                    amount: formatCurrency(affiliate.pendingEarnings),
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("payouts.createDialog.method")}</Label>
                <Input
                  value={newPayout.method}
                  onChange={(e) =>
                    setNewPayout((prev) => ({ ...prev, method: e.target.value }))
                  }
                  placeholder={t("payouts.createDialog.methodPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("payouts.createDialog.notes")}</Label>
                <Input
                  value={newPayout.notes}
                  onChange={(e) =>
                    setNewPayout((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder={t("payouts.createDialog.notesPlaceholder")}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreatePayout}
                disabled={isCreating || newPayout.amountCents <= 0}
              >
                {isCreating
                  ? t("payouts.createDialog.creating")
                  : t("payouts.createDialog.submit")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t("payouts.summary.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-orange-600">
              {formatCurrency(affiliate.pendingEarnings)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t("payouts.summary.paid")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(affiliate.paidEarnings)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t("payouts.summary.total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {formatCurrency(affiliate.totalEarnings)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Payouts list */}
      <Card>
        <CardHeader>
          <CardTitle>{t("payouts.list.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-center text-text-secondary py-8">
              {t("payouts.list.empty")}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-custom">
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("payouts.list.amount")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("payouts.list.method")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("payouts.list.status")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("payouts.list.date")}
                  </th>
                  <th className="text-right text-sm font-medium text-text-secondary px-4 py-3">
                    {t("payouts.list.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className="border-b border-border-custom last:border-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(payout.amountCents, payout.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {payout.method || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusClassNames[payout.status]}`}
                      >
                        {statusIcons[payout.status]}
                        {statusLabels[payout.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(payout.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payout.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleMarkCompleted(payout.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t("payouts.list.markCompleted")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleMarkFailed(payout.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t("payouts.list.markFailed")}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
