'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { organizationsApi } from '@/lib/api/organizations';
import type { Organization } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizationDetailsPage() {
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, [params.id]);

  async function loadOrganization() {
    try {
      const data = await organizationsApi.findOne(params.id as string);
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <Link href={`/admin/organizations/${organization.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Slug</p>
            <p className="mt-1">{organization.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Email de facturation
            </p>
            <p className="mt-1">{organization.billingEmail}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Abonnement SaaS
            </p>
            <p className="mt-1">
              {organization.saasActive ? 'Actif' : 'Inactif'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fuseau horaire</p>
            <p className="mt-1">{organization.timezone || 'UTC'}</p>
          </div>
          {organization.stripeAccountId && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                Compte Stripe
              </p>
              <p className="mt-1 font-mono text-sm">
                {organization.stripeAccountId}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500">Créé le</p>
            <p className="mt-1">
              {new Date(organization.createdAt).toLocaleString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Dernière mise à jour
            </p>
            <p className="mt-1">
              {new Date(organization.updatedAt).toLocaleString('fr-FR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
