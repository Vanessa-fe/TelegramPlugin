'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { organizationsApi } from '@/lib/api/organizations';
import type { Organization } from '@/types/organization';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

export default function OrganizationsPage() {
  const t = useTranslations('admin.organizations');
  const locale = useLocale();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizations = useCallback(async () => {
    try {
      const data = await organizationsApi.findAll();
      setOrganizations(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || t('toast.loadError')
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Link href="/admin/organizations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('new')}
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.slug')}</TableHead>
              <TableHead>{t('table.billingEmail')}</TableHead>
              <TableHead>{t('table.currency')}</TableHead>
              <TableHead>{t('table.saas')}</TableHead>
              <TableHead>{t('table.stripe')}</TableHead>
              <TableHead>{t('table.createdAt')}</TableHead>
              <TableHead>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.slug}</TableCell>
                  <TableCell>{org.billingEmail}</TableCell>
                  <TableCell>{org.currency}</TableCell>
                  <TableCell>
                    {org.saasActive ? t('table.status.active') : t('table.status.inactive')}
                  </TableCell>
                  <TableCell className="text-xs">
                    {org.stripeAccountId ? (
                      <span className="font-mono">{org.stripeAccountId}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {t('table.stripeNotConnected')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(org.createdAt).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/organizations/${org.id}`}>
                      <Button variant="ghost" size="sm">
                        {t('table.view')}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
