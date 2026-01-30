"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChannelProvider,
  type Channel,
  type CreateChannelDto,
} from "@/types/channel";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type ChannelFormData = {
  provider: ChannelProvider;
  externalId: string;
  title?: string;
  username?: string;
  inviteLink?: string;
  isActive?: boolean;
};

interface ChannelFormProps {
  organizationId: string;
  channel?: Channel;
  onSubmit: (data: CreateChannelDto) => void | Promise<void>;
}

export function ChannelForm({
  organizationId,
  channel,
  onSubmit,
}: ChannelFormProps) {
  const t = useTranslations("channels.form");
  const th = useTranslations("channels.howToFindId");

  // ✅ Zod schema with translated error messages
  const channelFormSchema = useMemo(
    () =>
      z.object({
        provider: z.nativeEnum(ChannelProvider),
        externalId: z.string().min(1, t("validation.externalIdRequired")),
        title: z.string().optional(),
        username: z.string().optional(),
        inviteLink: z
          .string()
          .url(t("validation.invalidUrl"))
          .optional()
          .or(z.literal("")),
        isActive: z.boolean().optional(),
      }),
    [t]
  );

  const providerOptions = useMemo(
    () => [
      { value: ChannelProvider.TELEGRAM, label: t("providers.telegram") },
      { value: ChannelProvider.DISCORD, label: t("providers.discord") },
      // si tu ajoutes Whatsapp plus tard : { value: ChannelProvider.WHATSAPP, label: t("providers.whatsapp") }
    ],
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: channel
      ? {
          provider: channel.provider,
          externalId: channel.externalId,
          title: channel.title || "",
          username: channel.username || "",
          inviteLink: channel.inviteLink || "",
          isActive: channel.isActive,
        }
      : {
          provider: ChannelProvider.TELEGRAM,
          isActive: true,
        },
  });

  const selectedProvider = watch("provider");

  async function onSubmitForm(data: ChannelFormData) {
    const payload: CreateChannelDto = {
      organizationId,
      provider: data.provider,
      externalId: data.externalId,
      title: data.title || undefined,
      username: data.username || undefined,
      inviteLink: data.inviteLink || undefined,
      isActive: data.isActive ?? true,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("sectionTitle")}</h2>

        {/* Provider */}
        <div>
          <Label htmlFor="provider">{t("providerLabel")}</Label>
          <Select
            value={selectedProvider}
            onValueChange={(value: string) =>
              setValue("provider", value as ChannelProvider)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("providerPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {providerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.provider && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.provider.message || "")}
            </p>
          )}

          <p className="mt-1 text-xs text-muted-foreground">
            {t("providerHelp")}
          </p>
        </div>

        {/* External ID */}
        <div>
          <Label htmlFor="externalId">{t("externalIdLabel")}</Label>
          <Input
            id="externalId"
            {...register("externalId")}
            placeholder={t("externalIdPlaceholder")}
          />
          {errors.externalId && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.externalId.message || "")}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("externalIdHelp")}
          </p>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">{t("titleLabel")}</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder={t("titlePlaceholder")}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.title.message || "")}
            </p>
          )}
        </div>

        {/* Username */}
        <div>
          <Label htmlFor="username">{t("usernameLabel")}</Label>
          <Input
            id="username"
            {...register("username")}
            placeholder={t("usernamePlaceholder")}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.username.message || "")}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("usernameHelp")}
          </p>
        </div>

        {/* Invite link */}
        <div>
          <Label htmlFor="inviteLink">{t("inviteLinkLabel")}</Label>
          <Input
            id="inviteLink"
            {...register("inviteLink")}
            placeholder={t("inviteLinkPlaceholder")}
          />
          {errors.inviteLink && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.inviteLink.message || "")}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("inviteLinkHelp")}
          </p>
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register("isActive")}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            {t("isActiveLabel")}
          </Label>
        </div>
      </div>

      {/* How to find ID helper */}
      <div className="rounded-lg border bg-blue-50 p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-xl">{th("titleIcon")}</span>
            {th("title")}
          </h3>

          <div className="space-y-4 text-sm text-blue-900">
            <div className="bg-white/50 rounded p-3 space-y-2">
              <p className="font-medium">{th("method1.title")}</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>{th("method1.steps.1")}</li>
                <li>{th("method1.steps.2")}</li>
                <li>{th("method1.steps.3")}</li>
              </ol>
              <div className="ml-2">
                <span className="font-mono bg-white px-1 rounded">
                  @userinfobot
                </span>
              </div>
            </div>

            <div className="bg-white/50 rounded p-3 space-y-2">
              <p className="font-medium">{th("method2.title")}</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>{th("method2.steps.1")}</li>
                <li>{th("method2.steps.2")}</li>
                <li>{th("method2.steps.3")}</li>
              </ol>
              <div className="ml-2">
                <span className="font-mono bg-white px-1 rounded">
                  @getidsbot
                </span>
              </div>
            </div>

            <div className="bg-white/50 rounded p-3 space-y-2">
              <p className="font-medium">{th("method3.title")}</p>
              <p className="ml-2">{th("method3.text")}</p>
              <div className="ml-2">
                <span className="font-mono bg-white px-1 rounded">
                  https://t.me/joinchat/XXXXXX
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-200 pt-3">
          <p className="text-xs text-blue-700">
            {th("important.prefix")}{" "}
            <span className="font-medium">{th("important.label")}</span>{" "}
            {th("important.text")}
          </p>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("buttons.saving")
            : channel
              ? t("buttons.update")
              : t("buttons.create")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          {t("buttons.cancel")}
        </Button>
      </div>
    </form>
  );
}
