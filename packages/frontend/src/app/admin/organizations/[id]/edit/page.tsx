'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { organizationsApi } from '@/lib/api/organizations';
import { OrganizationForm } from '@/components/organizations/organization-form';
import type {
  Organization,
  UpdateOrganizationDto,
} from '@/types/organization';
import { toast } from 'sonner';

export default function EditOrganizationPage() {
  const params = useParams();
  const organizationId = params.id as string;
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganization = useCallback(async () => {
    try {
      const data = await organizationsApi.findOne(organizationId);
      setOrganization(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors du chargement de l\'organisation'
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  async function handleSubmit(data: UpdateOrganizationDto) {
    try {
      await organizationsApi.update(organizationId, data);
      toast.success('Organisation mise à jour avec succès');
      router.push(`/admin/organizations/${organizationId}`);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors de la mise à jour de l\'organisation'
      );
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

  if (!organization) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Organisation introuvable</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier l&apos;organisation</h1>
        <p className="mt-2 text-gray-600">
          Modifiez les informations de l&apos;organisation {organization.name}.
        </p>
      </div>
      <OrganizationForm organization={organization} onSubmit={handleSubmit} />
    </div>
  );
}
