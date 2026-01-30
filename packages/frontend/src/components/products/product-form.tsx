"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/organization";
import { ProductStatus, type CreateProductDto } from "@/types/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormData = {
  organizationId: string;
  name: string;
  description?: string;
  status?: ProductStatus;
};

interface ProductFormProps {
  onSubmit: (data: CreateProductDto) => Promise<void>;
  organizations?: Organization[];
  organizationId?: string;
  lockOrganization?: boolean;
}

export function ProductForm({
  onSubmit,
  organizations,
  organizationId,
  lockOrganization = false,
}: ProductFormProps) {
  const t = useTranslations("products");

  const productSchema = useMemo(
    () =>
      z.object({
        organizationId: z.string().uuid(t("form.errors.organizationRequired")),
        name: z
          .string()
          .min(1, t("form.errors.nameRequired"))
          .max(120, t("form.errors.nameTooLong")),
        description: z
          .string()
          .max(2048, t("form.errors.descriptionTooLong"))
          .optional()
          .or(z.literal("")),
        status: z.nativeEnum(ProductStatus).optional(),
      }),
    [t]
  );

  const statusLabels: Record<ProductStatus, string> = {
    DRAFT: t("statusLabels.DRAFT"),
    ACTIVE: t("statusLabels.ACTIVE"),
    ARCHIVED: t("statusLabels.ARCHIVED"),
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      organizationId: organizationId ?? organizations?.[0]?.id ?? "",
      name: "",
      description: "",
      status: ProductStatus.DRAFT,
    },
  });

  useEffect(() => {
    const nextOrganizationId = organizationId ?? organizations?.[0]?.id;
    if (nextOrganizationId) {
      setValue("organizationId", nextOrganizationId);
    }
  }, [organizationId, organizations, setValue]);

  const showOrganizationSelect = !lockOrganization && !!organizations?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("form.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organizationId">
              {t("form.organization.label")}
            </Label>

            {showOrganizationSelect ? (
              <select
                id="organizationId"
                {...register("organizationId")}
                disabled={isSubmitting}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {organizations?.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="organizationId"
                {...register("organizationId")}
                disabled={isSubmitting}
                readOnly={lockOrganization}
                placeholder={t("form.organization.placeholder")}
              />
            )}

            {errors.organizationId && (
              <p className="text-sm text-destructive">
                {errors.organizationId.message as string}
              </p>
            )}

            <p className="mt-1 text-xs text-muted-foreground">
              {t("form.organization.help")}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("form.name.label")}</Label>
            <Input
              id="name"
              {...register("name")}
              disabled={isSubmitting}
              placeholder={t("form.name.placeholder")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message as string}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("form.description.label")}</Label>
            <textarea
              id="description"
              {...register("description")}
              disabled={isSubmitting}
              className={cn(
                "flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              placeholder={t("form.description.placeholder")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message as string}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">{t("form.status.label")}</Label>
            <select
              id="status"
              {...register("status")}
              disabled={isSubmitting}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {(Object.keys(statusLabels) as ProductStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("form.submit.saving") : t("form.submit.create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
