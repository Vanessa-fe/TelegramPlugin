"use client";

import { ProductForm } from "@/components/products/product-form";
import { PageBackButton } from "@/components/ui/page-back-button";
import { useAuth } from "@/contexts/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import { productsApi } from "@/lib/api/products";
import { UserRole } from "@/types/auth";
import type { CreateProductDto, UpdateProductDto } from "@/types/product";
import type { Organization } from "@/types/organization";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditProductPage() {
  const t = useTranslations("products");
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Awaited<ReturnType<typeof productsApi.findOne>> | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadData() {
      try {
        const productId = params.id as string;
        const [productData, orgsData] = await Promise.all([
          productsApi.findOne(productId),
          currentUser.role === UserRole.SUPERADMIN
            ? organizationsApi.findAll()
            : Promise.resolve([]),
        ]);

        setProduct(productData);
        setOrganizations(orgsData);
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(axiosError.response?.data?.message || t("toast.loadError"));
        router.push("/dashboard/products");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id, router, t, user]);

  async function handleSubmit(data: CreateProductDto) {
    if (!product) return;

    try {
      const payload: UpdateProductDto = {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description?.trim() || undefined,
        status: data.status,
      };

      await productsApi.update(product.id, payload);
      toast.success(t("toast.updateSuccess"));
      router.push("/dashboard/products");
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

  if (!user || !product) return null;

  const lockOrganization = user.role !== UserRole.SUPERADMIN;
  const defaultOrganizationId = lockOrganization
    ? (user.organizationId ?? product.organizationId ?? "")
    : product.organizationId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageBackButton href="/dashboard/products" />

      <div>
        <h1 className="text-3xl font-bold">{t("edit.title")}</h1>
        <p className="mt-2 text-gray-600">{t("edit.subtitle", { name: product.name })}</p>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        organizations={organizations}
        organizationId={defaultOrganizationId}
        lockOrganization={lockOrganization}
        initialData={product}
        isEdit
      />
    </div>
  );
}
