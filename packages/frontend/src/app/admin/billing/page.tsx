'use client';

import { useEffect, useMemo, useState } from 'react';
import { organizationsApi } from '@/lib/api/organizations';
import type { Organization } from '@/types/organization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

export default function BillingPage() {
  const t = useTranslations('admin.billing');
  const locale = useLocale();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
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
  }

  const connectedStripeCount = useMemo(
    () => organizations.filter((org) => Boolean(org.stripeAccountId)).length,
    [organizations]
  );
  const activeSaasCount = useMemo(
    () => organizations.filter((org) => org.saasActive).length,
    [organizations]
  );

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
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('cards.organizations.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{organizations.length}</p>
            <p className="text-sm text-muted-foreground">
              {t('cards.organizations.description')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('cards.stripe.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{connectedStripeCount}</p>
            <p className="text-sm text-muted-foreground">
              {t('cards.stripe.description')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('cards.saas.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeSaasCount}</p>
            <p className="text-sm text-muted-foreground">
              {t('cards.saas.description')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.organization')}</TableHead>
              <TableHead>{t('table.billingEmail')}</TableHead>
              <TableHead>{t('table.stripe')}</TableHead>
              <TableHead>{t('table.createdAt')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.billingEmail}</TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
