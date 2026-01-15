'use client';

import { useEffect, useMemo, useState } from 'react';
import { billingApi } from '@/lib/api/billing';
import type { StripeStatus } from '@/types/billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BillingPage() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningStripe, setIsOpeningStripe] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const data = await billingApi.getStripeStatus();
      setStatus(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors du chargement de la facturation'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnectStripe() {
    try {
      setIsConnecting(true);
      const { url } = await billingApi.createStripeConnectLink();
      window.location.href = url;
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Impossible de demarrer la connexion Stripe'
      );
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleOpenStripe() {
    try {
      setIsOpeningStripe(true);
      const { url } = await billingApi.createStripeLoginLink();
      window.location.href = url;
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          "Impossible d'ouvrir Stripe"
      );
    } finally {
      setIsOpeningStripe(false);
    }
  }

  const stripeReady = useMemo(() => {
    if (!status?.connected) {
      return false;
    }
    return Boolean(status.chargesEnabled && status.detailsSubmitted);
  }, [status]);

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

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturation</h1>
        <p className="mt-2 text-gray-600">
          Connectez Stripe pour encaisser les paiements de vos membres.
        </p>
      </div>

      {!status.saasActive && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">Abonnement requis</CardTitle>
          </CardHeader>
        <CardContent className="text-sm text-amber-900">
            Votre abonnement SaaS n&apos;est pas actif. Les paiements sont desactives.
            Contactez-nous pour reactiver votre acces.
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {status.connected ? 'Connecte' : 'Non connecte'}
            </span>
            {status.connected && (
              <>
                <span className="text-muted-foreground">
                  Charges&nbsp;: {status.chargesEnabled ? 'OK' : 'A activer'}
                </span>
                <span className="text-muted-foreground">
                  Details&nbsp;: {status.detailsSubmitted ? 'OK' : 'A completer'}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleConnectStripe} disabled={isConnecting}>
              {status.connected
                ? stripeReady
                  ? 'Mettre a jour Stripe'
                  : 'Finaliser Stripe'
                : 'Connecter Stripe'}
            </Button>
            {status.connected && (
              <Button
                variant="outline"
                onClick={handleOpenStripe}
                disabled={isOpeningStripe}
              >
                Ouvrir Stripe
              </Button>
            )}
          </div>

          {status.connected && status.accountId && (
            <p className="text-xs text-muted-foreground">
              Compte Stripe : <span className="font-mono">{status.accountId}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
