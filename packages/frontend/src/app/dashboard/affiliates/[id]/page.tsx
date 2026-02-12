"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { affiliatesApi } from "@/lib/api/affiliates";
import type {
  Affiliate,
  AffiliateReferral,
  AffiliateStatus,
} from "@/types/affiliate";
import { ArrowLeft, Edit, Ban, Users, TrendingUp, Clock, Coins } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const statusClassNames: Record<AffiliateStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  DEACTIVATED: "bg-gray-100 text-gray-500",
};

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("affiliates");

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusLabels: Record<AffiliateStatus, string> = {
    PENDING: t("statusLabels.PENDING"),
    ACTIVE: t("statusLabels.ACTIVE"),
    SUSPENDED: t("statusLabels.SUSPENDED"),
    DEACTIVATED: t("statusLabels.DEACTIVATED"),
  };

  const loadAffiliate = useCallback(async () => {
    try {
      const id = params.id as string;
      const [affiliateData, referralsData] = await Promise.all([
        affiliatesApi.findOne(id),
        affiliatesApi.getReferrals(id),
      ]);
      setAffiliate(affiliateData);
      setReferrals(referralsData);
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
    loadAffiliate();
  }, [loadAffiliate]);

  async function handleDeactivate() {
    if (!affiliate) return;
    try {
      await affiliatesApi.deactivate(affiliate.id);
      toast.success(t("toast.deactivateSuccess"));
      loadAffiliate();
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

  if (!affiliate) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/affiliates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("detail.back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center gap-3">
              {affiliate.name || affiliate.email}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassNames[affiliate.status]}`}
              >
                {statusLabels[affiliate.status]}
              </span>
            </h1>
            {affiliate.name && (
              <p className="text-text-secondary">{affiliate.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/affiliates/${affiliate.id}/payouts`}>
            <Button variant="outline">
              <Coins className="h-4 w-4 mr-2" />
              {t("detail.payouts")}
            </Button>
          </Link>
          <Link href={`/dashboard/affiliates/${affiliate.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {t("detail.edit")}
            </Button>
          </Link>
          {affiliate.status !== "DEACTIVATED" && (
            <Button variant="destructive" onClick={handleDeactivate}>
              <Ban className="h-4 w-4 mr-2" />
              {t("detail.deactivate")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("detail.stats.referrals")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{referrals.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("detail.stats.commission")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{affiliate.commissionRate}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Coins className="h-4 w-4" />
              {t("detail.stats.totalEarnings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(affiliate.totalEarnings)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("detail.stats.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-orange-600">
              {formatCurrency(affiliate.pendingEarnings)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.referralCode.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
              {affiliate.referralCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(affiliate.referralCode);
                toast.success(t("detail.referralCode.copied"));
              }}
            >
              {t("detail.referralCode.copy")}
            </Button>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            {t("detail.referralCode.help")}
          </p>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.referrals.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-center text-text-secondary py-8">
              {t("detail.referrals.empty")}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-custom">
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.customer")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.plan")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.amount")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.commission")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.status")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-border-custom last:border-0"
                  >
                    <td className="px-4 py-3 text-sm">
                      {referral.customer?.telegramUsername ||
                        referral.customer?.email ||
                        "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {referral.subscription?.plan?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(referral.amountCents, referral.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      {formatCurrency(referral.commissionCents, referral.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          referral.isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {referral.isPaid
                          ? t("detail.referrals.paid")
                          : t("detail.referrals.pending")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(referral.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
