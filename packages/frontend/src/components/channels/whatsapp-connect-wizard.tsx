"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { channelsApi } from "@/lib/api/channels";
import { ChannelProvider, ChannelType } from "@/types/channel";
import { useAuth } from "@/contexts/auth-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WhatsAppConnectWizard() {
  const t = useTranslations("channels.whatsappWizard");
  const router = useRouter();
  const { user } = useAuth();

  const [groupName, setGroupName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const organizationId = user?.organizationId;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organizationId || !groupName.trim() || !inviteLink.trim()) {
      toast.error(t("errors.missing"));
      return;
    }

    setIsSubmitting(true);
    try {
      await channelsApi.create({
        organizationId,
        provider: ChannelProvider.WHATSAPP,
        type: ChannelType.GROUP,
        externalId: inviteLink.trim(),
        title: groupName.trim(),
        inviteLink: inviteLink.trim(),
        metadata: {
          manualAccess: true,
        },
      });

      toast.success(t("success"));
      router.push("/dashboard/channels");
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("errors.createFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("description")}
        </p>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("stepsTitle")}
          </h3>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>1. {t("steps.1")}</li>
            <li>2. {t("steps.2")}</li>
            <li>3. {t("steps.3")}</li>
          </ul>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t("formTitle")}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="whatsappGroupName">{t("fields.nameLabel")}</Label>
            <Input
              id="whatsappGroupName"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder={t("fields.namePlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="whatsappInviteLink">{t("fields.linkLabel")}</Label>
            <Input
              id="whatsappInviteLink"
              value={inviteLink}
              onChange={(event) => setInviteLink(event.target.value)}
              placeholder={t("fields.linkPlaceholder")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("fields.linkHelp")}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("buttons.loading") : t("buttons.connect")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
