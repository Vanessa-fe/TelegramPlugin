"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/organization";
import { CouponType, type CreateCouponDto, type Coupon } from "@/types/coupon";
import type { Plan } from "@/types/plan";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { z } from "zod";

type FormData = {
  organizationId: string;
  code: string;
  type: CouponType;
  discountValue: number;
  currency?: string;
  maxUses?: number;
  expiresAt?: string;
  planIds: string[];
};

interface CouponFormProps {
  onSubmit: (data: CreateCouponDto) => Promise<void>;
  organizations?: Organization[];
  organizationId?: string;
  lockOrganization?: boolean;
  plans?: Plan[];
  initialData?: Coupon;
  isEdit?: boolean;
}

export function CouponForm({
  onSubmit,
  organizations,
  organizationId,
  lockOrganization = false,
  plans = [],
  initialData,
  isEdit = false,
}: CouponFormProps) {
  const t = useTranslations("coupons");

  const couponSchema = useMemo(
    () =>
      z.object({
        organizationId: z.string().uuid(t("form.errors.organizationRequired")),
        code: z
          .string()
          .min(3, t("form.errors.codeTooShort"))
          .max(32, t("form.errors.codeTooLong"))
          .regex(/^[A-Z0-9_-]+$/i, t("form.errors.codeInvalid"))
          .transform((v) => v.toUpperCase()),
        type: z.nativeEnum(CouponType),
        discountValue: z.coerce
          .number()
          .int()
          .positive(t("form.errors.discountRequired")),
        currency: z.preprocess(
          (v) => (v === "" ? undefined : v),
          z.string().length(3).optional()
        ),
        maxUses: z.preprocess(
          (v) => (v === "" || v === undefined ? undefined : Number(v)),
          z.number().int().positive().optional()
        ),
        expiresAt: z.preprocess(
          (v) => (v === "" ? undefined : v),
          z.string().optional()
        ),
        planIds: z.array(z.string()).default([]),
      }),
    [t]
  );

  const typeLabels: Record<CouponType, string> = {
    PERCENTAGE: t("typeLabels.PERCENTAGE"),
    FIXED_AMOUNT: t("typeLabels.FIXED_AMOUNT"),
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(couponSchema) as Resolver<FormData>,
    defaultValues: {
      organizationId: initialData?.organizationId ?? organizationId ?? organizations?.[0]?.id ?? "",
      code: initialData?.code ?? "",
      type: initialData?.type ?? CouponType.PERCENTAGE,
      discountValue: initialData?.discountValue ?? 10,
      currency: initialData?.currency ?? "EUR",
      maxUses: initialData?.maxUses ?? undefined,
      expiresAt: initialData?.expiresAt
        ? new Date(initialData.expiresAt).toISOString().split("T")[0]
        : "",
      planIds: initialData?.planIds ?? [],
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    const nextOrganizationId = organizationId ?? organizations?.[0]?.id;
    if (nextOrganizationId) {
      setValue("organizationId", nextOrganizationId);
    }
  }, [organizationId, organizations, setValue]);

  const showOrganizationSelect = !lockOrganization && !!organizations?.length;

  async function handleFormSubmit(data: FormData) {
    const payload: CreateCouponDto = {
      organizationId: data.organizationId,
      code: data.code,
      type: data.type,
      discountValue: data.discountValue,
      currency: data.type === CouponType.FIXED_AMOUNT ? data.currency : undefined,
      maxUses: data.maxUses || undefined,
      expiresAt: data.expiresAt || undefined,
      planIds: data.planIds,
    };
    await onSubmit(payload);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? t("form.titleEdit") : t("form.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Organization */}
          {lockOrganization ? (
            <input type="hidden" {...register("organizationId")} />
          ) : showOrganizationSelect ? (
            <div className="space-y-2">
              <Label htmlFor="organizationId">
                {t("form.organization.label")}
              </Label>
              <select
                id="organizationId"
                {...register("organizationId")}
                disabled={isSubmitting || isEdit}
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
              {errors.organizationId && (
                <p className="text-sm text-destructive">
                  {errors.organizationId.message as string}
                </p>
              )}
            </div>
          ) : null}

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">{t("form.code.label")}</Label>
            <Input
              id="code"
              {...register("code")}
              disabled={isSubmitting}
              placeholder={t("form.code.placeholder")}
              className="uppercase"
            />
            {errors.code && (
              <p className="text-sm text-destructive">
                {errors.code.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("form.code.help")}
            </p>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">{t("form.type.label")}</Label>
            <select
              id="type"
              {...register("type")}
              disabled={isSubmitting}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {(Object.keys(typeLabels) as CouponType[]).map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Discount Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountValue">{t("form.discountValue.label")}</Label>
              <div className="relative">
                <Input
                  id="discountValue"
                  type="number"
                  {...register("discountValue")}
                  disabled={isSubmitting}
                  min={1}
                  max={selectedType === CouponType.PERCENTAGE ? 100 : undefined}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {selectedType === CouponType.PERCENTAGE ? "%" : "cents"}
                </span>
              </div>
              {errors.discountValue && (
                <p className="text-sm text-destructive">
                  {errors.discountValue.message as string}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedType === CouponType.PERCENTAGE
                  ? t("form.discountValue.helpPercentage")
                  : t("form.discountValue.helpFixed")}
              </p>
            </div>

            {/* Currency - only for FIXED_AMOUNT */}
            {selectedType === CouponType.FIXED_AMOUNT && (
              <div className="space-y-2">
                <Label htmlFor="currency">{t("form.currency.label")}</Label>
                <Input
                  id="currency"
                  {...register("currency")}
                  disabled={isSubmitting}
                  placeholder="EUR"
                  maxLength={3}
                  className="uppercase"
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">
                    {errors.currency.message as string}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Max Uses */}
          <div className="space-y-2">
            <Label htmlFor="maxUses">{t("form.maxUses.label")}</Label>
            <Input
              id="maxUses"
              type="number"
              {...register("maxUses")}
              disabled={isSubmitting}
              min={1}
              placeholder={t("form.maxUses.placeholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("form.maxUses.help")}
            </p>
          </div>

          {/* Expires At */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">{t("form.expiresAt.label")}</Label>
            <Input
              id="expiresAt"
              type="date"
              {...register("expiresAt")}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {t("form.expiresAt.help")}
            </p>
          </div>

          {/* Plan IDs */}
          {plans.length > 0 && (
            <div className="space-y-2">
              <Label>{t("form.planIds.label")}</Label>
              <div className="space-y-2 rounded-md border p-4 max-h-48 overflow-y-auto">
                <Controller
                  name="planIds"
                  control={control}
                  render={({ field }) => (
                    <>
                      {plans.map((plan) => (
                        <label
                          key={plan.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={field.value.includes(plan.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, plan.id]);
                              } else {
                                field.onChange(
                                  field.value.filter((id) => id !== plan.id)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{plan.name}</span>
                        </label>
                      ))}
                    </>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("form.planIds.help")}
              </p>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? t("form.submit.saving")
              : isEdit
                ? t("form.submit.update")
                : t("form.submit.create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
