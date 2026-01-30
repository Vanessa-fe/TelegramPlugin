"use client";

import { ProductForm } from "@/components/products/product-form";
import { useAuth } from "@/contexts/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import { productsApi } from "@/lib/api/products";
import { UserRole } from "@/types/auth";
import type { Organization } from "@/types/organization";
import type { CreateProductDto } from "@/types/product";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewProductPage() {
  const t = useTranslations("products");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleSubmit(data: CreateProductDto) {
    try {
      const payload: CreateProductDto = {
        ...data,
        description: data.description?.trim() || undefined,
      };
      await productsApi.create(payload);
      toast.success(t("toast.createSuccess"));
      router.push("/dashboard/products");
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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

      <ProductForm
        onSubmit={handleSubmit}
        organizations={organizations}
        organizationId={defaultOrganizationId}
        lockOrganization={lockOrganization}
      />
    </div>
  );
}
