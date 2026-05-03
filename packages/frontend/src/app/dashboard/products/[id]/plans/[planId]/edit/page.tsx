"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";

import { PlanForm } from "@/components/plans/plan-form";
import { PageBackButton } from "@/components/ui/page-back-button";
import { Button } from "@/components/ui/button";
import { organizationsApi } from "@/lib/api/organizations";
import { plansApi } from "@/lib/api/plans";
import { productsApi } from "@/lib/api/products";
import type { CreatePlanDto, Plan, UpdatePlanDto } from "@/types/plan";
import type { Product } from "@/types/product";

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("plans.editPage");
  const productId = params.id as string;
  const planId = params.planId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [organizationCurrency, setOrganizationCurrency] = useState("EUR");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, planId]);

  async function loadData() {
    try {
      const [productData, planData] = await Promise.all([
        productsApi.findOne(productId),
        plansApi.findOne(planId),
      ]);

      if (planData.productId !== productId) {
        throw new Error("Plan does not belong to this product");
      }

      const organization = await organizationsApi.findOne(
        productData.organizationId,
      );

      setProduct(productData);
      setPlan(planData);
      setOrganizationCurrency(organization.currency);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || t("toast.loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(data: CreatePlanDto) {
    try {
      const payload: UpdatePlanDto = {
        productId: data.productId,
        name: data.name,
        description: data.description,
        interval: data.interval,
        priceCents: data.priceCents,
        currency: data.currency,
        trialPeriodDays: data.trialPeriodDays,
        accessDurationDays: data.accessDurationDays,
        isActive: data.isActive,
        metadata: data.metadata,
      };

      await plansApi.update(planId, payload);
      toast.success(t("toast.updateSuccess"));
      router.push(`/dashboard/products/${productId}/plans`);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || t("toast.updateError"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!product || !plan) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">{t("notFound")}</p>
        <div className="flex justify-center">
          <Link href={`/dashboard/products/${productId}/plans`}>
            <Button variant="outline">{t("backToPlans")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageBackButton href={`/dashboard/products/${productId}/plans`} />

      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-gray-600">
          {t("subtitle", { planName: plan.name, productName: product.name })}
        </p>
      </div>

      <PlanForm
        productId={productId}
        plan={plan}
        organizationCurrency={organizationCurrency}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
