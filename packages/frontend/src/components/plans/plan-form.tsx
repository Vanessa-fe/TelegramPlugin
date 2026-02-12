"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { PlanInterval, type CreatePlanDto, type Plan } from "@/types/plan";

const makePlanFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    description: z.string().optional(),
    interval: z.nativeEnum(PlanInterval),
    price: z.coerce.number().positive(t("validation.pricePositive")),
    currency: z.string().length(3, t("validation.currency3Letters")),
    trialPeriodDays: z.coerce.number().int().nonnegative().optional(),
    accessDurationDays: z.coerce.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  });

type PlanFormData = z.infer<ReturnType<typeof makePlanFormSchema>>;

interface PlanFormProps {
  productId: string;
  plan?: Plan;
  organizationCurrency?: string;
  onSubmit: (data: CreatePlanDto) => void | Promise<void>;
}

export function PlanForm({
  productId,
  plan,
  organizationCurrency,
  onSubmit,
}: PlanFormProps) {
  const t = useTranslations("planForm");

  const planFormSchema = useMemo(() => makePlanFormSchema(t), [t]);

  const intervalOptions = useMemo(
    () => [
      { value: PlanInterval.ONE_TIME, label: t("intervals.ONE_TIME") },
      { value: PlanInterval.DAY, label: t("intervals.DAY") },
      { value: PlanInterval.WEEK, label: t("intervals.WEEK") },
      { value: PlanInterval.MONTH, label: t("intervals.MONTH") },
      { value: PlanInterval.QUARTER, label: t("intervals.QUARTER") },
      { value: PlanInterval.YEAR, label: t("intervals.YEAR") },
    ],
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          description: plan.description || "",
          interval: plan.interval,
          price: plan.priceCents / 100,
          currency: plan.currency,
          trialPeriodDays: plan.trialPeriodDays || undefined,
          accessDurationDays: plan.accessDurationDays || undefined,
          isActive: plan.isActive,
        }
      : {
          currency: organizationCurrency ?? "EUR",
          interval: PlanInterval.MONTH,
          isActive: true,
        },
  });

  const selectedInterval = watch("interval");

  useEffect(() => {
    if (organizationCurrency) {
      setValue("currency", organizationCurrency);
    }
  }, [organizationCurrency, setValue]);

  async function onSubmitForm(data: PlanFormData) {
    const payload: CreatePlanDto = {
      productId,
      name: data.name,
      description: data.description || undefined,
      interval: data.interval,
      priceCents: Math.round(data.price * 100),
      currency: (organizationCurrency ?? data.currency).toUpperCase(),
      trialPeriodDays: data.trialPeriodDays || undefined,
      accessDurationDays: data.accessDurationDays || undefined,
      isActive: data.isActive ?? true,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {t("sections.general")}
        </h2>

        <div>
          <Label htmlFor="name">{t("fields.nameLabel")}</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={t("fields.namePlaceholder")}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">
            {t("fields.descriptionLabel")}
          </Label>
          <Input
            id="description"
            {...register("description")}
            placeholder={t("fields.descriptionPlaceholder")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="interval">
            {t("fields.billingTypeLabel")}
          </Label>
          <Select
            value={selectedInterval}
            onValueChange={(value) =>
              setValue("interval", value as PlanInterval)
            }
          >
            <SelectTrigger>
              <span>
                {intervalOptions.find((opt) => opt.value === selectedInterval)
                  ?.label || t("fields.intervalPlaceholder")}
              </span>
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.interval && (
            <p className="mt-1 text-sm text-red-600">
              {errors.interval.message}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {t("sections.pricing")}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">{t("fields.priceLabel")}</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register("price")}
              placeholder={t("fields.pricePlaceholder")}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.price.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="currency">
              {t("fields.currencyLabel")}
            </Label>
            <Input
              id="currency"
              {...register("currency")}
              placeholder={t("fields.currencyPlaceholder")}
              maxLength={3}
              readOnly={Boolean(organizationCurrency)}
              className={organizationCurrency ? "bg-muted" : ""}
            />
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">
                {errors.currency.message}
              </p>
            )}
            {organizationCurrency && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("fields.currencyLocked")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {t("sections.advanced")}
        </h2>

        <div>
          <Label htmlFor="trialPeriodDays">
            {t("fields.trialLabel")}
          </Label>
          <Input
            id="trialPeriodDays"
            type="number"
            {...register("trialPeriodDays")}
            placeholder={t("fields.trialPlaceholder")}
          />
          {errors.trialPeriodDays && (
            <p className="mt-1 text-sm text-red-600">
              {errors.trialPeriodDays.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("fields.trialHelper")}
          </p>
        </div>

        <div>
          <Label htmlFor="accessDurationDays">
            {t("fields.accessDurationLabel")}
          </Label>
          <Input
            id="accessDurationDays"
            type="number"
            {...register("accessDurationDays")}
            placeholder={t("fields.accessDurationPlaceholder")}
          />
          {errors.accessDurationDays && (
            <p className="mt-1 text-sm text-red-600">
              {errors.accessDurationDays.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("fields.accessDurationHelper")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register("isActive")}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            {t("fields.activeLabel")}
          </Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("actions.saving")
            : plan
              ? t("actions.update")
              : t("actions.create")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          {t("actions.cancel")}
        </Button>
      </div>
    </form>
  );
}
