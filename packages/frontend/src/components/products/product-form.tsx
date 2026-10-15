"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { channelsApi } from "@/lib/api/channels";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/channel";
import type { Organization } from "@/types/organization";
import { ProductStatus, type CreateProductDto, type Product } from "@/types/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormData = {
  organizationId: string;
  name: string;
  description?: string;
  status?: ProductStatus;
  channelIds: string[];
};

const providerLabels: Record<Channel["provider"], string> = {
  TELEGRAM: "Telegram",
  DISCORD: "Discord",
  WHATSAPP: "WhatsApp",
};

function channelLabel(channel: Channel): string {
  return (
    channel.title ||
    (channel.username ? `@${channel.username}` : channel.externalId)
  );
}

interface ProductFormProps {
  onSubmit: (data: CreateProductDto) => Promise<void>;
  organizations?: Organization[];
  organizationId?: string;
  lockOrganization?: boolean;
  initialData?: Product;
  isEdit?: boolean;
}

export function ProductForm({
  onSubmit,
  organizations,
  organizationId,
  lockOrganization = false,
  initialData,
  isEdit = false,
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
        channelIds: z.array(z.string().uuid()),
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
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      organizationId: initialData?.organizationId ?? organizationId ?? organizations?.[0]?.id ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      status: initialData?.status ?? ProductStatus.DRAFT,
      channelIds: initialData?.channelIds ?? [],
    },
  });

  useEffect(() => {
    const nextOrganizationId = organizationId ?? organizations?.[0]?.id;
    if (nextOrganizationId) {
      setValue("organizationId", nextOrganizationId);
    }
  }, [organizationId, organizations, setValue]);

  const selectedOrganizationId = watch("organizationId");
  const selectedChannelIds = watch("channelIds");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);

  useEffect(() => {
    if (!selectedOrganizationId) return;
    let cancelled = false;
    setChannelsLoading(true);

    channelsApi
      .findAll(selectedOrganizationId)
      .then((data) => {
        if (cancelled) return;
        setChannels(data);
        // Drop channels of another organization, then preselect the only
        // channel for a new offer
        const kept = getValues("channelIds").filter((id) =>
          data.some((channel) => channel.id === id)
        );
        const activeChannels = data.filter((channel) => channel.isActive);
        setValue(
          "channelIds",
          !isEdit && kept.length === 0 && activeChannels.length === 1
            ? [activeChannels[0].id]
            : kept
        );
      })
      .catch(() => {
        if (!cancelled) setChannels([]);
      })
      .finally(() => {
        if (!cancelled) setChannelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId, isEdit, getValues, setValue]);

  const selectableChannels = channels.filter(
    (channel) => channel.isActive || selectedChannelIds.includes(channel.id)
  );

  function toggleChannel(channelId: string, checked: boolean) {
    const current = getValues("channelIds");
    setValue(
      "channelIds",
      checked
        ? [...current, channelId]
        : current.filter((id) => id !== channelId),
      { shouldDirty: true }
    );
  }

  const showOrganizationSelect = !lockOrganization && !!organizations?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? t("form.titleEdit") : t("form.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Organization - hidden for regular users, select for SUPERADMIN */}
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
              {errors.organizationId && (
                <p className="text-sm text-destructive">
                  {errors.organizationId.message as string}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {t("form.organization.help")}
              </p>
            </div>
          ) : null}

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

          {/* Channels buyers get access to */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium leading-none">
              {t("form.channels.label")}
            </legend>
            <p className="text-xs text-muted-foreground">
              {t("form.channels.help")}
            </p>
            {channelsLoading ? (
              <p className="text-sm text-muted-foreground">
                {t("form.channels.loading")}
              </p>
            ) : selectableChannels.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {t("form.channels.empty")}{" "}
                <Link
                  href="/dashboard/channels/new"
                  className="font-medium underline"
                >
                  {t("form.channels.emptyLink")}
                </Link>
              </p>
            ) : (
              <div className="space-y-2 rounded-md border border-input p-3">
                {selectableChannels.map((channel) => (
                  <label
                    key={channel.id}
                    className="flex cursor-pointer items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChannelIds.includes(channel.id)}
                      onChange={(event) =>
                        toggleChannel(channel.id, event.target.checked)
                      }
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 accent-purple-600"
                    />
                    <span className="font-medium">{channelLabel(channel)}</span>
                    <span className="text-xs text-muted-foreground">
                      {providerLabels[channel.provider]}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {!channelsLoading &&
              selectableChannels.length > 0 &&
              selectedChannelIds.length === 0 && (
                <p className="text-sm text-amber-700">
                  {t("form.channels.noneSelected")}
                </p>
              )}
          </fieldset>

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
