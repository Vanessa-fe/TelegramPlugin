"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getVisibleAffiliateEmail } from "@/lib/affiliate-utils";
import type { Organization } from "@/types/organization";
import { AffiliateStatus, type CreateAffiliateDto, type Affiliate, type AffiliateProgram } from "@/types/affiliate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Copy, Link as LinkIcon, Check } from "lucide-react";
import { toast } from "sonner";

type FormData = {
  organizationId: string;
  email?: string;
  name?: string;
  referralCode?: string;
  commissionRate: number;
  status: AffiliateStatus;
};

interface AffiliateFormProps {
  onSubmit: (data: CreateAffiliateDto) => Promise<void>;
  organizations?: Organization[];
  organizationId?: string;
  lockOrganization?: boolean;
  initialData?: Affiliate;
  isEdit?: boolean;
  affiliateProgram?: AffiliateProgram | null;
}

export function AffiliateForm({
  onSubmit,
  organizations,
  organizationId,
  lockOrganization = false,
  initialData,
  isEdit = false,
  affiliateProgram,
}: AffiliateFormProps) {
  const t = useTranslations("affiliates");
  const [useCustomCommission, setUseCustomCommission] = useState(false);
  const defaultCommissionRate = affiliateProgram?.commissionValue ?? 10;

  const affiliateSchema = useMemo(
    () =>
      z.object({
        organizationId: z.string().uuid(t("form.errors.organizationRequired")),
        email: z
          .string()
          .trim()
          .email(t("form.errors.emailInvalid"))
          .optional()
          .or(z.literal("")),
        name: z.string().max(120).optional().or(z.literal("")),
        referralCode: z
          .string()
          .min(3, t("form.errors.codeTooShort"))
          .max(32, t("form.errors.codeTooLong"))
          .regex(/^[A-Z0-9_-]+$/i, t("form.errors.codeInvalid"))
          .transform((v) => v.toUpperCase())
          .optional()
          .or(z.literal("")),
        commissionRate: z.coerce
          .number()
          .int()
          .min(1, t("form.errors.commissionMin"))
          .max(100, t("form.errors.commissionMax")),
        status: z.nativeEnum(AffiliateStatus),
      }),
    [t]
  );

  const initialVisibleEmail = getVisibleAffiliateEmail(initialData?.email);

  const statusLabels: Record<AffiliateStatus, string> = {
    PENDING: t("statusLabels.PENDING"),
    ACTIVE: t("statusLabels.ACTIVE"),
    SUSPENDED: t("statusLabels.SUSPENDED"),
    DEACTIVATED: t("statusLabels.DEACTIVATED"),
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(affiliateSchema),
    defaultValues: {
      organizationId: initialData?.organizationId ?? organizationId ?? organizations?.[0]?.id ?? "",
      email: initialVisibleEmail ?? "",
      name: initialData?.name ?? "",
      referralCode: initialData?.referralCode ?? "",
      commissionRate: initialData?.commissionRate ?? defaultCommissionRate,
      status: initialData?.status ?? AffiliateStatus.ACTIVE,
    },
  });

  // Determine if this affiliate has a custom commission (different from program default)
  useEffect(() => {
    if (isEdit && initialData && affiliateProgram) {
      setUseCustomCommission(initialData.commissionRate !== affiliateProgram.commissionValue);
    }
  }, [isEdit, initialData, affiliateProgram]);

  const watchedReferralCode = useWatch({ control, name: "referralCode" });
  const watchedOrgId = useWatch({ control, name: "organizationId" });
  const [copied, setCopied] = useState(false);

  const selectedOrg = organizations?.find((org) => org.id === watchedOrgId);
  const affiliateLink = useMemo(() => {
    if (!watchedReferralCode || watchedReferralCode.length < 3) return null;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const orgSlug = selectedOrg?.slug || "";
    if (!orgSlug) return null;
    return `${baseUrl}/${orgSlug}?ref=${watchedReferralCode.toUpperCase()}`;
  }, [watchedReferralCode, selectedOrg]);

  function copyToClipboard() {
    if (!affiliateLink) return;
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast.success(t("form.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    const nextOrganizationId = organizationId ?? organizations?.[0]?.id;
    if (nextOrganizationId) {
      setValue("organizationId", nextOrganizationId);
    }
  }, [organizationId, organizations, setValue]);

  const showOrganizationSelect = !lockOrganization && !!organizations?.length;

  async function handleFormSubmit(data: FormData) {
    const payload: CreateAffiliateDto = {
      organizationId: data.organizationId,
      email: data.email?.trim() || undefined,
      name: data.name || undefined,
      referralCode: data.referralCode || undefined,
      commissionRate: data.commissionRate,
      status: data.status,
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t("form.email.label")}</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={isSubmitting}
              placeholder={t("form.email.placeholder")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("form.email.help")}
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

          {/* Referral Code */}
          <div className="space-y-2">
            <Label htmlFor="referralCode">{t("form.referralCode.label")}</Label>
            <Input
              id="referralCode"
              {...register("referralCode")}
              disabled={isSubmitting}
              placeholder={t("form.referralCode.placeholder")}
              className="uppercase"
            />
            {errors.referralCode && (
              <p className="text-sm text-destructive">
                {errors.referralCode.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("form.referralCode.help")}
            </p>
          </div>

          {/* Link Preview */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              {t("form.linkPreview.label")}
            </Label>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex-1 bg-muted p-3 rounded-md font-mono text-sm break-all",
                !affiliateLink && "text-muted-foreground"
              )}>
                {affiliateLink || (
                  <span className="italic">
                    {selectedOrg?.slug
                      ? `${typeof window !== "undefined" ? window.location.origin : ""}/${selectedOrg.slug}?ref=CODE`
                      : t("form.linkPreview.help")}
                  </span>
                )}
              </div>
              {affiliateLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {!affiliateLink && (
              <p className="text-xs text-muted-foreground">
                {t("form.linkPreview.help")}
              </p>
            )}
          </div>

          {/* Custom Commission Checkbox */}
          {affiliateProgram && !isEdit && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomCommission"
                checked={useCustomCommission}
                onChange={(e) => {
                  setUseCustomCommission(e.target.checked);
                  if (!e.target.checked) {
                    setValue("commissionRate", defaultCommissionRate);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="useCustomCommission" className="text-sm font-normal cursor-pointer">
                {t("form.customCommission.label")}
              </Label>
            </div>
          )}

          {/* Commission Rate - show always in edit mode, or when custom commission is checked in create mode */}
          {(isEdit || useCustomCommission || !affiliateProgram) && (
            <div className="space-y-2">
              <Label htmlFor="commissionRate">
                {useCustomCommission ? t("form.customCommission.rateLabel") : t("form.commissionRate.label")}
              </Label>
              <div className="relative">
                <Input
                  id="commissionRate"
                  type="number"
                  {...register("commissionRate")}
                  disabled={isSubmitting}
                  min={1}
                  max={100}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              {errors.commissionRate && (
                <p className="text-sm text-destructive">
                  {errors.commissionRate.message as string}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("form.commissionRate.help")}
              </p>
            </div>
          )}

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
              {(Object.keys(statusLabels) as AffiliateStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

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
