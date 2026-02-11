"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { couponsApi } from "@/lib/api/coupons";
import type { Coupon, CouponStatus, CouponType } from "@/types/coupon";
import { MoreHorizontal, Percent, Plus, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const statusClassNames: Record<CouponStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  DISABLED: "bg-gray-100 text-gray-500",
};

const typeIcons: Record<CouponType, React.ReactNode> = {
  PERCENTAGE: <Percent className="h-3 w-3" />,
  FIXED_AMOUNT: <Tag className="h-3 w-3" />,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("coupons");
  const locale = useLocale();

  const statusLabels: Record<CouponStatus, string> = {
    ACTIVE: t("statusLabels.ACTIVE"),
    EXPIRED: t("statusLabels.EXPIRED"),
    DISABLED: t("statusLabels.DISABLED"),
  };

  const loadCoupons = useCallback(async () => {
    try {
      const data = await couponsApi.findAll();
      setCoupons(data);
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
    loadCoupons();
  }, [loadCoupons]);

  async function handleDisable(id: string) {
    try {
      await couponsApi.disable(id);
      toast.success(t("toast.disableSuccess"));
      loadCoupons();
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
        <Link href="/dashboard/coupons/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Button>
        </Link>
      </div>

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl border-border-custom p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {t("empty.title")}
          </h3>
          <p className="text-text-secondary mb-6 max-w-sm mx-auto">
            {t("empty.description")}
          </p>
          <Link href="/dashboard/coupons/new">
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
                  {t("table.code")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.discount")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.usage")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.status")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.expires")}
                </th>
                <th className="text-right text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-border-custom last:border-0 hover:bg-surface transition-colors"
                >
                  <td className="px-6 py-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {coupon.code}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {typeIcons[coupon.type]}
                      <span className="font-medium text-text-primary">
                        {formatDiscount(coupon)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {coupon.usedCount}
                    {coupon.maxUses && ` / ${coupon.maxUses}`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassNames[coupon.status]}`}
                    >
                      {statusLabels[coupon.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
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
                          <Link href={`/dashboard/coupons/${coupon.id}`}>
                            {t("actions.view")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/coupons/${coupon.id}/edit`}>
                            {t("actions.edit")}
                          </Link>
                        </DropdownMenuItem>
                        {coupon.status === "ACTIVE" && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDisable(coupon.id)}
                          >
                            {t("actions.disable")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
