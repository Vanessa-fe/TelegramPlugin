"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { couponsApi } from "@/lib/api/coupons";
import type { Coupon, CouponUsage, CouponStatus } from "@/types/coupon";
import { ArrowLeft, Percent, Tag, Edit, Ban } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const statusClassNames: Record<CouponStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  DISABLED: "bg-gray-100 text-gray-500",
};

export default function CouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("coupons");

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusLabels: Record<CouponStatus, string> = {
    ACTIVE: t("statusLabels.ACTIVE"),
    EXPIRED: t("statusLabels.EXPIRED"),
    DISABLED: t("statusLabels.DISABLED"),
  };

  const loadCoupon = useCallback(async () => {
    try {
      const id = params.id as string;
      const [couponData, usagesData] = await Promise.all([
        couponsApi.findOne(id),
        couponsApi.getUsages(id),
      ]);
      setCoupon(couponData);
      setUsages(usagesData);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.loadError"));
      router.push("/dashboard/coupons");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router, t]);

  useEffect(() => {
    loadCoupon();
  }, [loadCoupon]);

  async function handleDisable() {
    if (!coupon) return;
    try {
      await couponsApi.disable(coupon.id);
      toast.success(t("toast.disableSuccess"));
      loadCoupon();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.disableError"));
    }
  }

  function formatDiscount(coupon: Coupon) {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.discountValue}%`;
    }
    const amount = coupon.discountValue / 100;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: coupon.currency || "EUR",
    }).format(amount);
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

  if (!coupon) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/coupons">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("detail.back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center gap-3">
              <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono">
                {coupon.code}
              </code>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassNames[coupon.status]}`}
              >
                {statusLabels[coupon.status]}
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/coupons/${coupon.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {t("detail.edit")}
            </Button>
          </Link>
          {coupon.status === "ACTIVE" && (
            <Button variant="destructive" onClick={handleDisable}>
              <Ban className="h-4 w-4 mr-2" />
              {t("detail.disable")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t("detail.stats.discount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {coupon.type === "PERCENTAGE" ? (
                <Percent className="h-5 w-5 text-purple-600" />
              ) : (
                <Tag className="h-5 w-5 text-purple-600" />
              )}
              <span className="text-2xl font-bold">{formatDiscount(coupon)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t("detail.stats.usage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {coupon.usedCount}
              {coupon.maxUses && (
                <span className="text-base font-normal text-text-secondary">
                  {" "}
                  / {coupon.maxUses}
                </span>
              )}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t("detail.stats.totalSaved")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {formatCurrency(
                usages.reduce((sum, u) => sum + u.discountCents, 0)
              )}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t("detail.stats.expires")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {coupon.expiresAt
                ? new Date(coupon.expiresAt).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : t("detail.stats.never")}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Usages */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.usages.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {usages.length === 0 ? (
            <p className="text-center text-text-secondary py-8">
              {t("detail.usages.empty")}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-custom">
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.usages.plan")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.usages.original")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.usages.discount")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.usages.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {usages.map((usage) => (
                  <tr
                    key={usage.id}
                    className="border-b border-border-custom last:border-0"
                  >
                    <td className="px-4 py-3 text-sm">
                      {usage.subscription?.plan?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(usage.originalCents)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      -{formatCurrency(usage.discountCents)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(usage.createdAt).toLocaleDateString(locale, {
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
