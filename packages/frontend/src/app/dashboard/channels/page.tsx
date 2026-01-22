'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { channelsApi } from '@/lib/api/channels';
import type { Channel, AccessStatus } from '@/types/channel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, CheckCircle, XCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';

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
        axiosError.response?.data?.message ||
          'Erreur lors du chargement des channels'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channels Telegram</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les accès à vos channels Telegram
          </p>
        </div>
        <Link href="/dashboard/channels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un channel
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {channels.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              Aucun channel Telegram configuré
            </p>
            <Link href="/dashboard/channels/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter votre premier channel
              </Button>
            </Link>
          </Card>
        ) : (
          channels.map((channel) => (
            <Card key={channel.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">
                      {channel.title || 'Sans titre'}
                    </h2>
                    {channel.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                        <XCircle className="h-4 w-4" />
                        Inactif
                      </span>
                    )}
                  </div>
                  {channel.username && (
                    <p className="text-sm text-muted-foreground mt-1">
                      @{channel.username}
                    </p>
                  )}
                  {channel.inviteLink && (
                    <a
                      href={channel.inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      {channel.inviteLink}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/channels/${channel.id}/access`}>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Gérer les accès
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="text-sm font-medium">{channel.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID externe</p>
                  <p className="text-sm font-mono">{channel.externalId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="text-sm">
                    {new Date(channel.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
