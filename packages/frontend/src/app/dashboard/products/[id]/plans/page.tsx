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
import { plansApi } from "@/lib/api/plans";
import { productsApi } from "@/lib/api/products";
import type { Plan, PlanInterval } from "@/types/plan";
import type { Product } from "@/types/product";
import { ArrowLeft, CheckCircle, Edit, Plus, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const intervalLabels: Record<PlanInterval, string> = {
  ONE_TIME: "Paiement unique",
  DAY: "Jour",
  WEEK: "Semaine",
  MONTH: "Mois",
  QUARTER: "Trimestre",
  YEAR: "Année",
};

export default function ProductPlansPage() {
  const params = useParams();
  const productId = params.id as string;
  const locale = useLocale();
  const t = useTranslations("plans");
  const [product, setProduct] = useState<Product | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function loadData() {
    try {
      const [productData, plansData] = await Promise.all([
        productsApi.findOne(productId),
        plansApi.findAll({ productId }),
      ]);
      setProduct(productData);
      setPlans(plansData);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message ||
          "Erreur lors du chargement des données"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function formatPrice(priceCents: number, currency: string): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(priceCents / 100);
  }

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

  if (!product) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">{t("empty")}</p>
        <div className="flex justify-center">
          <Link href="/dashboard/products">
            <Button variant="outline">{t("back")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href={`/dashboard/products/${productId}/plans/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.price")}</TableHead>
              <TableHead>{t("table.interval")}</TableHead>
              <TableHead>{t("table.trial")}</TableHead>
              <TableHead>{t("table.accessDuration")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  {t("empty")}
                  <div className="mt-2">
                    <Link href={`/dashboard/products/${productId}/plans/new`}>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("createFirst")}
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    {formatPrice(plan.priceCents, plan.currency)}
                  </TableCell>
                  <TableCell>{intervalLabels[plan.interval]}</TableCell>
                  <TableCell>
                    {plan.trialPeriodDays
                      ? `${plan.trialPeriodDays} jours`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {plan.accessDurationDays
                      ? `${plan.accessDurationDays} ${t("accessDays", {
                          count: plan.accessDurationDays,
                        })}`
                      : "Illimité"}
                  </TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {t("status.active")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <XCircle className="h-4 w-4" />
                        {t("status.inactive")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/products/${productId}/plans/${plan.id}/edit`}
                    >
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
