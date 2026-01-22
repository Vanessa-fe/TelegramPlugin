'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { channelsApi } from '@/lib/api/channels';
import { useAuth } from '@/contexts/auth-context';
import { ChannelForm } from '@/components/channels/channel-form';
import type { CreateChannelDto } from '@/types/channel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewChannelPage() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleSubmit(data: CreateChannelDto) {
    try {
      await channelsApi.create(data);
      toast.success('Channel ajouté avec succès');
      router.push('/dashboard/channels');
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors de l\'ajout du channel'
      );
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/channels">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Ajouter un channel</h1>
          <p className="mt-2 text-gray-600">
            Connectez un channel Telegram à votre organisation
          </p>
        </div>
      </div>
      <ChannelForm
        organizationId={user.organizationId || ''}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
