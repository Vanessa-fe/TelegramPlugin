'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { entitlementsApi } from '@/lib/api/entitlements';
import type { Entitlement } from '@/types/entitlement';
import { EntitlementType } from '@/types/entitlement';
import { Button } from '@/components/ui/button';

const entitlementTypeLabels: Record<EntitlementType, string> = {
  [EntitlementType.CHANNEL_ACCESS]: 'Accès Channel',
  [EntitlementType.FEATURE_FLAG]: 'Feature Flag',
  [EntitlementType.CONTENT_UNLOCK]: 'Contenu Débloqué',
  [EntitlementType.API_QUOTA]: 'Quota API',
};

const entitlementTypeColors: Record<EntitlementType, string> = {
  [EntitlementType.CHANNEL_ACCESS]: 'bg-blue-100 text-blue-800',
  [EntitlementType.FEATURE_FLAG]: 'bg-purple-100 text-purple-800',
  [EntitlementType.CONTENT_UNLOCK]: 'bg-green-100 text-green-800',
  [EntitlementType.API_QUOTA]: 'bg-orange-100 text-orange-800',
};

export default function EntitlementsPage() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntitlements();
  }, []);

  async function loadEntitlements() {
    try {
      setLoading(true);
      const data = await entitlementsApi.findAll();
      setEntitlements(data);
    } catch (err) {
      setError('Erreur lors du chargement des entitlements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const activeCount = entitlements.filter(
    (e) => !e.revokedAt && (!e.expiresAt || new Date(e.expiresAt) > new Date())
  ).length;
  const expiredCount = entitlements.filter(
    (e) => e.expiresAt && new Date(e.expiresAt) < new Date() && !e.revokedAt
  ).length;
  const revokedCount = entitlements.filter((e) => e.revokedAt).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Entitlements</h1>
          <p className="text-gray-600 mt-1">
            Gérez les droits et permissions accordés aux clients
          </p>
        </div>
        <Link href="/dashboard/entitlements/new">
          <Button>Créer un entitlement</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-3xl font-bold mt-1">{entitlements.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Actifs</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Expirés</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{expiredCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Révoqués</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{revokedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Accordé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expire le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entitlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucun entitlement trouvé
                  </td>
                </tr>
              ) : (
                entitlements.map((entitlement) => {
                  const isExpired =
                    entitlement.expiresAt && new Date(entitlement.expiresAt) < new Date();
                  const isActive = !entitlement.revokedAt && !isExpired;

                  let statusBadge = '';
                  let statusText = '';

                  if (entitlement.revokedAt) {
                    statusBadge = 'bg-red-100 text-red-800';
                    statusText = 'Révoqué';
                  } else if (isExpired) {
                    statusBadge = 'bg-orange-100 text-orange-800';
                    statusText = 'Expiré';
                  } else {
                    statusBadge = 'bg-green-100 text-green-800';
                    statusText = 'Actif';
                  }

                  return (
                    <tr key={entitlement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {entitlement.entitlementKey}
                        </div>
                        {entitlement.resourceId && (
                          <div className="text-xs text-gray-500">
                            Resource: {entitlement.resourceId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            entitlementTypeColors[entitlement.type]
                          }`}
                        >
                          {entitlementTypeLabels[entitlement.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <Link
                          href={`/dashboard/customers/${entitlement.customerId}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {entitlement.customerId.substring(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(entitlement.grantedAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entitlement.expiresAt
                          ? new Date(entitlement.expiresAt).toLocaleDateString('fr-FR')
                          : 'Jamais'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                        {entitlement.revokedAt && entitlement.revokeReason && (
                          <div className="text-xs text-gray-500 mt-1">
                            Raison: {entitlement.revokeReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/dashboard/entitlements/${entitlement.id}`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Voir
                        </Link>
                        {isActive && (
                          <Link
                            href={`/dashboard/entitlements/${entitlement.id}/revoke`}
                            className="text-red-600 hover:text-red-800"
                          >
                            Révoquer
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
