'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import type { Subscription, SubscriptionStatus } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Actif',
  PAST_DUE: 'Impayé',
  CANCELED: 'Annulé',
  INCOMPLETE: 'Incomplet',
  TRIALING: 'Essai',
  EXPIRED: 'Expiré',
};

const statusColors: Record<SubscriptionStatus, string> = {
  ACTIVE: 'text-green-600 bg-green-50',
  PAST_DUE: 'text-orange-600 bg-orange-50',
  CANCELED: 'text-gray-600 bg-gray-50',
  INCOMPLETE: 'text-yellow-600 bg-yellow-50',
  TRIALING: 'text-blue-600 bg-blue-50',
  EXPIRED: 'text-red-600 bg-red-50',
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<SubscriptionStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const data = await subscriptionsApi.findAll();
      setSubscriptions(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors du chargement des abonnements'
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSubscriptions = filterStatus === 'ALL'
    ? subscriptions
    : subscriptions.filter(sub => sub.status === filterStatus);

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    past_due: subscriptions.filter(s => s.status === 'PAST_DUE').length,
    trialing: subscriptions.filter(s => s.status === 'TRIALING').length,
  };

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
      <div>
        <h1 className="text-3xl font-bold">Abonnements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez tous les abonnements actifs et passés
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">Actifs</p>
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="rounded-lg border bg-orange-50 p-4">
          <p className="text-sm text-orange-700">Impayés</p>
          <p className="text-2xl font-bold text-orange-700">{stats.past_due}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Essai</p>
          <p className="text-2xl font-bold text-blue-700">{stats.trialing}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as SubscriptionStatus | 'ALL')}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="PAST_DUE">Impayé</option>
          <option value="CANCELED">Annulé</option>
          <option value="TRIALING">Essai</option>
          <option value="EXPIRED">Expiré</option>
        </select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date de début</TableHead>
              <TableHead>Fin de période</TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Aucun abonnement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-mono text-xs">
                    {subscription.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        statusColors[subscription.status]
                      }`}
                    >
                      {statusLabels[subscription.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(subscription.startedAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {subscription.customerId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/customers/${subscription.customerId}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
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
