"use client";

import { CouponForm } from "@/components/coupons/coupon-form";
import { useAuth } from "@/contexts/auth-context";
import { couponsApi } from "@/lib/api/coupons";
import { organizationsApi } from "@/lib/api/organizations";
import { plansApi } from "@/lib/api/plans";
import { UserRole } from "@/types/auth";
import { CouponType, type CreateCouponDto, type UpdateCouponDto } from "@/types/coupon";
import type { Organization } from "@/types/organization";
import type { Plan } from "@/types/plan";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditCouponPage() {
  const t = useTranslations("coupons");
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [coupon, setCoupon] = useState<Awaited<ReturnType<typeof couponsApi.findOne>> | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadData() {
      try {
        const couponId = params.id as string;
        const [couponData, plansData, orgsData] = await Promise.all([
          couponsApi.findOne(couponId),
          plansApi.findAll(),
          currentUser.role === UserRole.SUPERADMIN
            ? organizationsApi.findAll()
            : Promise.resolve([]),
        ]);

        setCoupon(couponData);
        setPlans(plansData);
        setOrganizations(orgsData);
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(axiosError.response?.data?.message || t("toast.loadError"));
        router.push("/dashboard/coupons");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id, router, t, user]);

  async function handleSubmit(data: CreateCouponDto) {
    if (!coupon) return;

    try {
      const payload: UpdateCouponDto = {
        code: data.code,
        discountValue: data.discountValue,
        currency: data.type === CouponType.FIXED_AMOUNT ? data.currency : undefined,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ?? null,
        planIds: data.planIds ?? [],
      };
      await couponsApi.update(coupon.id, payload);
      toast.success(t("toast.updateSuccess"));
      router.push(`/dashboard/coupons/${coupon.id}`);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
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

  if (!user || !coupon) return null;

  const lockOrganization = user.role !== UserRole.SUPERADMIN;
  const defaultOrganizationId = lockOrganization
    ? (user.organizationId ?? coupon.organizationId ?? "")
    : coupon.organizationId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("form.titleEdit")}</h1>
        <p className="mt-2 text-gray-600">{coupon.code}</p>
      </div>

      <CouponForm
        onSubmit={handleSubmit}
        organizations={organizations}
        organizationId={defaultOrganizationId}
        lockOrganization={lockOrganization}
        plans={plans}
        initialData={coupon}
        isEdit
      />
    </div>
  );
}
