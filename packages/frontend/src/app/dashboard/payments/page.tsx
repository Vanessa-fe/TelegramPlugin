'use client';

import { useEffect, useState } from 'react';
import { paymentEventsApi } from '@/lib/api/payment-events';
import type { PaymentEvent, PaymentEventType, PaymentProvider } from '@/types/payment-event';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const eventTypeLabels: Record<PaymentEventType, string> = {
  CHECKOUT_COMPLETED: 'Paiement complété',
  SUBSCRIPTION_CREATED: 'Abonnement créé',
  SUBSCRIPTION_UPDATED: 'Abonnement mis à jour',
  SUBSCRIPTION_CANCELED: 'Abonnement annulé',
  INVOICE_PAID: 'Facture payée',
  INVOICE_PAYMENT_FAILED: 'Paiement échoué',
  REFUND_CREATED: 'Remboursement créé',
};

const eventTypeColors: Record<PaymentEventType, string> = {
  CHECKOUT_COMPLETED: 'text-green-600 bg-green-50',
  SUBSCRIPTION_CREATED: 'text-blue-600 bg-blue-50',
  SUBSCRIPTION_UPDATED: 'text-blue-600 bg-blue-50',
  SUBSCRIPTION_CANCELED: 'text-gray-600 bg-gray-50',
  INVOICE_PAID: 'text-green-600 bg-green-50',
  INVOICE_PAYMENT_FAILED: 'text-red-600 bg-red-50',
  REFUND_CREATED: 'text-orange-600 bg-orange-50',
};

const providerLabels: Record<PaymentProvider, string> = {
  STRIPE: 'Stripe',
  PAYPAL: 'PayPal',
};

export default function PaymentEventsPage() {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await paymentEventsApi.findAll();
      setEvents(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors du chargement des événements'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Événements de paiement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique de tous les événements de paiement (webhooks Stripe, etc.)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-muted-foreground">Total événements</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">Traités</p>
          <p className="text-2xl font-bold text-green-700">
            {events.filter(e => e.processedAt).length}
          </p>
        </div>
        <div className="rounded-lg border bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">En attente</p>
          <p className="text-2xl font-bold text-yellow-700">
            {events.filter(e => !e.processedAt).length}
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>ID externe</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Abonnement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Aucun événement de paiement trouvé
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        eventTypeColors[event.type]
                      }`}
                    >
                      {eventTypeLabels[event.type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      {providerLabels[event.provider]}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.externalId.slice(0, 20)}...
                  </TableCell>
                  <TableCell>
                    {new Date(event.occurredAt).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    {event.processedAt ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Traité
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                        <Clock className="h-4 w-4" />
                        En attente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.subscriptionId
                      ? `${event.subscriptionId.slice(0, 8)}...`
                      : '-'}
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
