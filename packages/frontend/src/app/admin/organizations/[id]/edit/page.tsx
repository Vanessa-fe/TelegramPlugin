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
import { useTranslations } from 'next-intl';

export default function EditOrganizationPage() {
  const params = useParams();
  const organizationId = params.id as string;
  const router = useRouter();
  const t = useTranslations('admin.organizationEdit');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganization = useCallback(async () => {
    try {
      const data = await organizationsApi.findOne(organizationId);
      setOrganization(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || t('toast.loadError')
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, t]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  async function handleSubmit(data: UpdateOrganizationDto) {
    try {
      await organizationsApi.update(organizationId, data);
      toast.success(t('toast.updateSuccess'));
      router.push(`/admin/organizations/${organizationId}`);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || t('toast.updateError')
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center">
        <p className="text-gray-600">{t('notFound')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-gray-600">
          {t('subtitle', { name: organization.name })}
        </p>
      </div>
      <OrganizationForm organization={organization} onSubmit={handleSubmit} />
    </div>
  );
}
