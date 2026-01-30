"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { paymentEventsApi } from "@/lib/api/payment-events";
import type {
  PaymentEvent,
  PaymentEventType,
  PaymentProvider,
} from "@/types/payment-event";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const eventTypeColors: Record<PaymentEventType, string> = {
  CHECKOUT_COMPLETED: "text-green-600 bg-green-50",
  SUBSCRIPTION_CREATED: "text-blue-600 bg-blue-50",
  SUBSCRIPTION_UPDATED: "text-blue-600 bg-blue-50",
  SUBSCRIPTION_CANCELED: "text-gray-600 bg-gray-50",
  INVOICE_PAID: "text-green-600 bg-green-50",
  INVOICE_PAYMENT_FAILED: "text-red-600 bg-red-50",
  REFUND_CREATED: "text-orange-600 bg-orange-50",
};

export default function PaymentEventsPage() {
  const t = useTranslations("payments");
  const locale = useLocale();

  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const eventTypeLabels: Record<PaymentEventType, string> = useMemo(
    () => ({
      CHECKOUT_COMPLETED: t("eventTypes.CHECKOUT_COMPLETED"),
      SUBSCRIPTION_CREATED: t("eventTypes.SUBSCRIPTION_CREATED"),
      SUBSCRIPTION_UPDATED: t("eventTypes.SUBSCRIPTION_UPDATED"),
      SUBSCRIPTION_CANCELED: t("eventTypes.SUBSCRIPTION_CANCELED"),
      INVOICE_PAID: t("eventTypes.INVOICE_PAID"),
      INVOICE_PAYMENT_FAILED: t("eventTypes.INVOICE_PAYMENT_FAILED"),
      REFUND_CREATED: t("eventTypes.REFUND_CREATED"),
    }),
    [t]
  );

  const providerLabels: Record<PaymentProvider, string> = useMemo(
    () => ({
      STRIPE: t("providers.STRIPE"),
      PAYPAL: t("providers.PAYPAL"),
    }),
    [t]
  );

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEvents() {
    try {
      const data = await paymentEventsApi.findAll();
      setEvents(data);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  const processedCount = useMemo(
    () => events.filter((e) => !!e.processedAt).length,
    [events]
  );
  const pendingCount = useMemo(
    () => events.filter((e) => !e.processedAt).length,
    [events]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>

        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">{t("stats.processed")}</p>
          <p className="text-2xl font-bold text-green-700">{processedCount}</p>
        </div>

        <div className="rounded-lg border bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">{t("stats.pending")}</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.provider")}</TableHead>
              <TableHead>{t("table.externalId")}</TableHead>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.subscription")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${eventTypeColors[event.type]}`}
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
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(event.occurredAt))}
                  </TableCell>

                  <TableCell>
                    {event.processedAt ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {t("status.processed")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                        <Clock className="h-4 w-4" />
                        {t("status.pending")}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {event.subscriptionId
                      ? `${event.subscriptionId.slice(0, 8)}...`
                      : t("common.na")}
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
