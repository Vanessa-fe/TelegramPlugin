"use client";

import { CouponForm } from "@/components/coupons/coupon-form";
import { useAuth } from "@/contexts/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import { couponsApi } from "@/lib/api/coupons";
import { plansApi } from "@/lib/api/plans";
import { UserRole } from "@/types/auth";
import type { Organization } from "@/types/organization";
import type { Plan } from "@/types/plan";
import type { CreateCouponDto } from "@/types/coupon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewCouponPage() {
  const t = useTranslations("coupons");

  const router = useRouter();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [orgsData, plansData] = await Promise.all([
          user?.role === UserRole.SUPERADMIN
            ? organizationsApi.findAll()
            : Promise.resolve([]),
          plansApi.findAll(),
        ]);
        setOrganizations(orgsData);
        setPlans(plansData.filter((p) => p.isActive));
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(
          axiosError.response?.data?.message || t("toast.loadError")
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, t]);

  async function handleSubmit(data: CreateCouponDto) {
    try {
      await couponsApi.create(data);
      toast.success(t("toast.createSuccess"));
      router.push("/dashboard/coupons");
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.createError"));
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

  if (!user) return null;

  const lockOrganization = user.role !== UserRole.SUPERADMIN;
  const defaultOrganizationId = lockOrganization
    ? (user.organizationId ?? "")
    : (organizations[0]?.id ?? "");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("new.title")}</h1>
        <p className="mt-2 text-gray-600">{t("new.subtitle")}</p>
      </div>

      <CouponForm
        onSubmit={handleSubmit}
        organizations={organizations}
        organizationId={defaultOrganizationId}
        lockOrganization={lockOrganization}
        plans={plans}
      />
    </div>
  );
}
