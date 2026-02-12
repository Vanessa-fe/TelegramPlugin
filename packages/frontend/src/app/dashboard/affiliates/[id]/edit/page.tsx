"use client";

import { AffiliateForm } from "@/components/affiliates/affiliate-form";
import { useAuth } from "@/contexts/auth-context";
import { affiliatesApi } from "@/lib/api/affiliates";
import { organizationsApi } from "@/lib/api/organizations";
import { UserRole } from "@/types/auth";
import type { CreateAffiliateDto, UpdateAffiliateDto } from "@/types/affiliate";
import type { Organization } from "@/types/organization";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditAffiliatePage() {
  const t = useTranslations("affiliates");
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Awaited<ReturnType<typeof affiliatesApi.findOne>> | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadData() {
      try {
        const affiliateId = params.id as string;
        const [affiliateData, orgsData] = await Promise.all([
          affiliatesApi.findOne(affiliateId),
          currentUser.role === UserRole.SUPERADMIN
            ? organizationsApi.findAll()
            : Promise.resolve([]),
        ]);

        setAffiliate(affiliateData);
        setOrganizations(orgsData);
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(axiosError.response?.data?.message || t("toast.loadError"));
        router.push("/dashboard/affiliates");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id, router, t, user]);

  async function handleSubmit(data: CreateAffiliateDto) {
    if (!affiliate) return;

    try {
      const payload: UpdateAffiliateDto = {
        email: data.email,
        name: data.name,
        referralCode: data.referralCode,
        commissionRate: data.commissionRate,
        status: data.status,
      };
      await affiliatesApi.update(affiliate.id, payload);
      toast.success(t("toast.updateSuccess"));
      router.push(`/dashboard/affiliates/${affiliate.id}`);
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

  if (!user || !affiliate) return null;

  const lockOrganization = user.role !== UserRole.SUPERADMIN;
  const defaultOrganizationId = lockOrganization
    ? (user.organizationId ?? affiliate.organizationId ?? "")
    : affiliate.organizationId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("form.titleEdit")}</h1>
        <p className="mt-2 text-gray-600">{affiliate.name || affiliate.email}</p>
      </div>

      <AffiliateForm
        onSubmit={handleSubmit}
        organizations={organizations}
        organizationId={defaultOrganizationId}
        lockOrganization={lockOrganization}
        initialData={affiliate}
        isEdit
      />
    </div>
  );
}
