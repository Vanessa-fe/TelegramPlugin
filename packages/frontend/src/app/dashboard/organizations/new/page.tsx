'use client';

import { useRouter } from 'next/navigation';
import { OrganizationForm } from '@/components/organizations/organization-form';
import type { CreateOrganizationDto } from '@/types/organization';
import { organizationsApi } from '@/lib/api/organizations';
import { toast } from 'sonner';

export default function NewOrganizationPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateOrganizationDto) {
    try {
      await organizationsApi.create(data);
      toast.success('Organisation créée avec succès');
      router.push('/dashboard/organizations');
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors de la création de l\'organisation'
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouvelle organisation</h1>
        <p className="mt-2 text-gray-600">
          Créez une nouvelle organisation pour gérer vos produits et channels.
        </p>
      </div>
      <OrganizationForm onSubmit={handleSubmit} />
    </div>
  );
}
