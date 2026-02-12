"use client";

import { Button } from "@/components/ui/button";
import { platformSubscriptionApi } from "@/lib/api/platform-subscription";
import type {
  PlatformPlan,
  PlatformPlanName,
  PlatformSubscription,
  PlatformSubscriptionStatus,
} from "@/types/platform-subscription";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PLAN_NAMES: PlatformPlanName[] = ["early-adopter", "pro"];

function statusLabel(status: PlatformSubscriptionStatus): string {
  const map: Record<PlatformSubscriptionStatus, string> = {
    TRIALING: "Essai",
    ACTIVE: "Actif",
    PAST_DUE: "Paiement en retard",
    CANCELED: "Annulé",
    INCOMPLETE: "Incomplet",
    EXPIRED: "Expiré",
  };
  return map[status];
}

export default function PlatformSubscriptionPage() {
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [subscriptionData, plansData] = await Promise.all([
        platformSubscriptionApi.getSubscription(),
        platformSubscriptionApi.getPlans(),
      ]);

      setSubscription(subscriptionData);
      setPlans(plansData.filter((plan) => PLAN_NAMES.includes(plan.name as PlatformPlanName)));
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible de charger l'abonnement");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canStartCheckout = useMemo(() => {
    if (!subscription) return true;
    return subscription.status !== "ACTIVE" && subscription.status !== "TRIALING";
  }, [subscription]);

  async function handleCheckout(planName: PlatformPlanName) {
    try {
      setIsProcessing(planName);
      const { url } = await platformSubscriptionApi.createCheckout(planName);
      window.location.href = url;
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible de lancer le checkout");
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleOpenPortal() {
    try {
      setIsProcessing("portal");
      const { url } = await platformSubscriptionApi.createPortal();
      window.location.href = url;
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Portail Stripe indisponible");
    } finally {
      setIsProcessing(null);
    }
  }

  function formatPrice(priceCents: number, currency: string) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(priceCents / 100);
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(date));
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">Chargement de l&apos;abonnement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Abonnement plateforme</h1>
        <p className="mt-1 text-text-secondary">
          Consulte ton plan actuel et gère ton abonnement Sublynk.
        </p>
      </div>

      <div className="rounded-xl border border-border-custom bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">Plan actuel</h2>

        {subscription?.plan ? (
          <div className="mt-4 space-y-3">
            <p className="text-text-primary">
              <span className="font-semibold">{subscription.plan.displayName}</span>
              <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                {statusLabel(subscription.status)}
              </span>
            </p>
            <p className="text-sm text-text-secondary">
              Prix: {formatPrice(subscription.plan.priceCents, subscription.plan.currency)} / mois
            </p>
            <p className="text-sm text-text-secondary">
              Période actuelle: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {subscription.stripeSubscriptionId && !subscription.isGrandfathered ? (
                <Button
                  onClick={handleOpenPortal}
                  disabled={isProcessing === "portal"}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isProcessing === "portal" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Gérer dans Stripe
                </Button>
              ) : (
                <p className="text-sm text-text-secondary">
                  Gestion automatique non disponible pour ce compte. Contacte le support pour modifier ce plan.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-text-secondary">Aucun abonnement actif pour le moment.</p>
        )}
      </div>

      <div className="rounded-xl border border-border-custom bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">Plans disponibles</h2>

        {!canStartCheckout && (
          <p className="mt-2 text-sm text-text-secondary">
            Ton abonnement est déjà actif. Utilise la gestion Stripe pour le modifier.
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-border-custom p-4">
              <p className="font-semibold text-text-primary">{plan.displayName}</p>
              <p className="mt-1 text-xl font-bold text-text-primary">
                {formatPrice(plan.priceCents, plan.currency)}
                <span className="ml-1 text-sm font-normal text-text-secondary">/mois</span>
              </p>

              {plan.trialPeriodDays ? (
                <p className="mt-1 text-xs text-green-600">
                  {plan.trialPeriodDays} jours d&apos;essai
                </p>
              ) : null}

              <Button
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!canStartCheckout || isProcessing === plan.name}
                onClick={() => handleCheckout(plan.name as PlatformPlanName)}
              >
                {isProcessing === plan.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Choisir ce plan
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
