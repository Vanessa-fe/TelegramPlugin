'use client';

import { useRouter } from 'next/navigation';
import { OrganizationForm } from '@/components/organizations/organization-form';
import { PageBackButton } from '@/components/ui/page-back-button';
import type { CreateOrganizationDto } from '@/types/organization';
import { organizationsApi } from '@/lib/api/organizations';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function NewOrganizationPage() {
  const router = useRouter();
  const t = useTranslations('admin.organizationsNew');

  async function handleSubmit(data: CreateOrganizationDto) {
    try {
      await organizationsApi.create(data);
      toast.success(t('toast.createSuccess'));
      router.push('/admin/organizations');
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || t('toast.createError')
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageBackButton href="/admin/organizations" />

      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-gray-600">
          {t('subtitle')}
        </p>
      </div>
      <OrganizationForm onSubmit={handleSubmit} />
    </div>
  );
}
