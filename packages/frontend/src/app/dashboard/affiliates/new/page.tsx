"use client";

import { AffiliateForm } from "@/components/affiliates/affiliate-form";
import { useAuth } from "@/contexts/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import { affiliatesApi } from "@/lib/api/affiliates";
import { UserRole } from "@/types/auth";
import type { Organization } from "@/types/organization";
import type { CreateAffiliateDto } from "@/types/affiliate";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewAffiliatePage() {
  const t = useTranslations("affiliates");

  const router = useRouter();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.role !== UserRole.SUPERADMIN) {
      setIsLoading(false);
      return;
    }

    loadOrganizations();
  }, [user]);

  async function loadOrganizations() {
    try {
      const data = await organizationsApi.findAll();
      setOrganizations(data);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toast.organizationsLoadError")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(data: CreateAffiliateDto) {
    try {
      await affiliatesApi.create(data);
      toast.success(t("toast.createSuccess"));
      router.push("/dashboard/affiliates");
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

      <AffiliateForm
        onSubmit={handleSubmit}
        organizations={organizations}
        organizationId={defaultOrganizationId}
        lockOrganization={lockOrganization}
      />
    </div>
  );
}
