"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { channelsApi } from "@/lib/api/channels";
import type { Channel } from "@/types/channel";

import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ExternalLink,
  Hash,
  Plus,
  Settings,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function ChannelsPage() {
  const t = useTranslations("channels");
  const locale = useLocale();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const providerConfig: Record<string, { label: string; color: string }> =
    useMemo(
      () => ({
        TELEGRAM: {
          label: t("providers.TELEGRAM"),
          color: "bg-blue-100 text-blue-700",
        },
        DISCORD: {
          label: t("providers.DISCORD"),
          color: "bg-indigo-100 text-indigo-700",
        },
        WHATSAPP: {
          label: t("providers.WHATSAPP"),
          color: "bg-green-100 text-green-700",
        },
      }),
      [t]
    );

  useEffect(() => {
    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadChannels() {
    try {
      const data = await channelsApi.findAll();
      setChannels(data);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("errors.load"));
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[#6F6E77]">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1523]">
            {t("title")}
          </h1>
          <p className="mt-1 text-[#6F6E77]">{t("subtitle")}</p>
        </div>

        <Link href="/dashboard/channels/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </Link>
      </div>

      {/* Channels list */}
      {channels.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E9E3EF] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Hash className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-semibold text-[#1A1523] mb-2">
            {t("empty.title")}
          </h3>
          <p className="text-[#6F6E77] mb-6 max-w-sm mx-auto">
            {t("empty.description")}
          </p>

          <Link href="/dashboard/channels/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              {t("empty.cta")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => {
            const provider = providerConfig[channel.provider] || {
              label: channel.provider,
              color: "bg-gray-100 text-gray-700",
            };

            return (
              <div
                key={channel.id}
                className="bg-white rounded-xl border border-[#E9E3EF] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Channel info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-lg font-semibold text-[#1A1523]">
                        {channel.title || t("labels.untitled")}
                      </h2>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${provider.color}`}
                      >
                        {provider.label}
                      </span>

                      {channel.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          {t("status.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                          <XCircle className="h-4 w-4" />
                          {t("status.inactive")}
                        </span>
                      )}
                    </div>

                    {channel.username && (
                      <p className="text-sm text-[#6F6E77] mt-1">
                        @{channel.username}
                      </p>
                    )}

                    {channel.inviteLink && (
                      <a
                        href={channel.inviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("actions.viewInviteLink")}
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <Link href={`/dashboard/channels/${channel.id}/access`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E9E3EF] hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {t("actions.manageAccess")}
                    </Button>
                  </Link>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-[#E9E3EF]">
                  <div>
                    <p className="text-xs text-[#6F6E77] uppercase tracking-wider">
                      {t("stats.provider")}
                    </p>
                    <p className="text-sm font-medium text-[#1A1523] mt-0.5">
                      {provider.label}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#6F6E77] uppercase tracking-wider">
                      {t("stats.externalId")}
                    </p>
                    <p className="text-sm font-mono text-[#1A1523] mt-0.5 truncate">
                      {channel.externalId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#6F6E77] uppercase tracking-wider">
                      {t("stats.created")}
                    </p>
                    <p className="text-sm text-[#1A1523] mt-0.5">
                      {new Intl.DateTimeFormat(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(channel.createdAt))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
