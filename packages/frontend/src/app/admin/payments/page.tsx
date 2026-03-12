'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Building2,
  Mail,
  User,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { organizationsApi } from '@/lib/api/organizations';

interface FailedPayment {
  id: string;
  occurredAt: string;
  amount: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  organizationId: string;
  organizationName: string;
  subscriptionId: string | null;
  invoiceUrl: string | null;
}

export default function PaymentsPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [payments, setPayments] = useState<FailedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(30);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSuspend = async (payment: FailedPayment) => {
    const reason = prompt(
      `Suspendre l'organisation "${payment.organizationName}" ?\n\nRaison (optionnelle) :`
    );
    if (reason === null) return; // User cancelled

    setActionLoading(payment.id);
    try {
      await organizationsApi.suspend(
        payment.organizationId,
        reason || `Impayé du ${new Date(payment.occurredAt).toLocaleDateString()}`
      );
      await loadPayments();
      alert(`Organisation "${payment.organizationName}" suspendue`);
    } catch {
      alert('Erreur lors de la suspension');
    } finally {
      setActionLoading(null);
    }
  };

  async function loadPayments() {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/admin/dashboard/unpaid?days=${daysFilter}`);
      setPayments(response.data);
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [daysFilter]);

  const formatCurrency = (amountInCents: number, currency: string) => {
    const amountInUnits = amountInCents / 100;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountInUnits);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">{t('nav.payments')}</h1>
          <p className="mt-1 text-gray-500">
            Paiements en échec nécessitant une action de relance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadPayments()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setDaysFilter(days)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              daysFilter === days
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {days} derniers jours
          </button>
        ))}
      </div>

      {/* Table or empty state */}
      {payments.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Aucun impayé
          </h3>
          <p className="mx-auto max-w-sm text-gray-500">
            Aucun paiement en échec sur les {daysFilter} derniers jours. Tout va bien !
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Montant
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Organisation
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-900">
                        {formatDate(payment.occurredAt)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {payment.customerName && (
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {payment.customerName}
                        </div>
                      )}
                      {payment.customerEmail && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {payment.customerEmail}
                        </div>
                      )}
                      {!payment.customerName && !payment.customerEmail && (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {payment.organizationName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payment.invoiceUrl && (
                        <a
                          href={payment.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Facture
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspend(payment)}
                        disabled={actionLoading === payment.id}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        {actionLoading === payment.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1">Suspendre</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {payments.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">
              {payments.length} paiement{payments.length > 1 ? 's' : ''} en échec
            </span>
          </div>
          <span className="font-semibold text-red-800">
            Total :{' '}
            {formatCurrency(
              payments.reduce((sum, p) => sum + p.amount, 0),
              'eur'
            )}
          </span>
        </div>
      )}
    </div>
  );
}
