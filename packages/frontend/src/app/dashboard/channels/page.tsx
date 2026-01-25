'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { channelsApi } from '@/lib/api/channels';
import type { Channel } from '@/types/channel';
import { Button } from '@/components/ui/button';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Settings,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

const providerConfig: Record<string, { label: string; color: string }> = {
  TELEGRAM: { label: 'Telegram', color: 'bg-blue-100 text-blue-700' },
  DISCORD: { label: 'Discord', color: 'bg-indigo-100 text-indigo-700' },
  WHATSAPP: { label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    try {
      const data = await channelsApi.findAll();
      setChannels(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || 'Failed to load channels'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[#6F6E77]">Loading channels...</p>
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
            Channels
          </h1>
          <p className="mt-1 text-[#6F6E77]">
            Manage your connected Telegram, Discord, and WhatsApp channels
          </p>
        </div>
        <Link href="/dashboard/channels/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add channel
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
            No channels yet
          </h3>
          <p className="text-[#6F6E77] mb-6 max-w-sm mx-auto">
            Connect your first channel to start granting access to your paying
            members.
          </p>
          <Link href="/dashboard/channels/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add your first channel
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => {
            const provider = providerConfig[channel.provider] || {
              label: channel.provider,
              color: 'bg-gray-100 text-gray-700',
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
                        {channel.title || 'Untitled channel'}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${provider.color}`}
                      >
                        {provider.label}
                      </span>
                      {channel.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                          <XCircle className="h-4 w-4" />
                          Inactive
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
                        View invite link
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
                      Manage access
                    </Button>
                  </Link>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-[#E9E3EF]">
                  <div>
                    <p className="text-xs text-[#6F6E77] uppercase tracking-wider">
                      Provider
                    </p>
                    <p className="text-sm font-medium text-[#1A1523] mt-0.5">
                      {provider.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6F6E77] uppercase tracking-wider">
                      External ID
                    </p>
                    <p className="text-sm font-mono text-[#1A1523] mt-0.5 truncate">
                      {channel.externalId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6F6E77] uppercase tracking-wider">
                      Created
                    </p>
                    <p className="text-sm text-[#1A1523] mt-0.5">
                      {new Date(channel.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
