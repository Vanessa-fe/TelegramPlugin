'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { organizationsApi } from '@/lib/api/organizations';
import type { Organization } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

export default function OrganizationDetailsPage() {
  const t = useTranslations('admin.organizationDetails');
  const locale = useLocale();
  const params = useParams();
  const organizationId = params.id as string;
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
  }, [organizationId]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <Link href={`/admin/organizations/${organization.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            {t('edit')}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('fields.slug')}
            </p>
            <p className="mt-1">{organization.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('fields.billingEmail')}
            </p>
            <p className="mt-1">{organization.billingEmail}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('fields.saas')}
            </p>
            <p className="mt-1">
              {organization.saasActive ? t('status.active') : t('status.inactive')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('fields.timezone')}
            </p>
            <p className="mt-1">{organization.timezone || 'UTC'}</p>
          </div>
          {organization.stripeAccountId && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t('fields.stripeAccount')}
              </p>
              <p className="mt-1 font-mono text-sm">
                {organization.stripeAccountId}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('fields.createdAt')}
            </p>
            <p className="mt-1">
              {new Date(organization.createdAt).toLocaleString(locale)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('fields.updatedAt')}
            </p>
            <p className="mt-1">
              {new Date(organization.updatedAt).toLocaleString(locale)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
