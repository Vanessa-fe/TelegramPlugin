'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Check, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { platformSubscriptionApi } from '@/lib/api/platform-subscription';
import { billingApi } from '@/lib/api/billing';
import type { PlatformSubscription, PlatformPlan } from '@/types/platform-subscription';
import type { StripeStatus } from '@/types/billing';

interface SubscriptionPromptProps {
  dismissible?: boolean;
}

export function SubscriptionPrompt({ dismissible = true }: SubscriptionPromptProps) {
  const t = useTranslations('dashboard.subscriptionPrompt');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  useEffect(() => {
    // Check if user has dismissed for this session
    const dismissed = sessionStorage.getItem('subscription-prompt-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    async function load() {
      try {
        const [sub, plansList, stripe] = await Promise.all([
          platformSubscriptionApi.getSubscription(),
          platformSubscriptionApi.getPlans(),
          billingApi.getStripeStatus(),
        ]);
        setSubscription(sub);
        setPlans(plansList.filter(p => p.isActive));
        setStripeStatus(stripe);
      } catch {
        // Silently fail - don't block the dashboard
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('subscription-prompt-dismissed', 'true');
  };

  const handleSelectPlan = async (planName: string) => {
    setCheckoutLoading(planName);
    try {
      const { url } = await platformSubscriptionApi.createCheckout(
        planName as 'starter' | 'growth' | 'pro'
      );
      window.location.href = url;
    } catch {
      // Redirect to billing page to connect Stripe
      router.push('/dashboard/billing');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    try {
      const { url } = await billingApi.createStripeConnectLink();
      window.location.href = url;
    } catch {
      router.push('/dashboard/billing');
    } finally {
      setIsConnectingStripe(false);
    }
  };

  // Don't show if loading
  if (isLoading) return null;

  // Don't show if dismissed
  if (isDismissed) return null;

  // Check if user has any active subscription (including starter)
  const hasActiveSubscription =
    subscription &&
    (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING');

  // Check if Stripe Connect is ready
  const stripeReady = Boolean(
    stripeStatus?.connected &&
    stripeStatus?.chargesEnabled &&
    stripeStatus?.detailsSubmitted
  );

  // Don't show if user has active subscription AND Stripe is connected
  if (hasActiveSubscription && stripeReady) return null;

  // Determine which mode to show
  const showStripeConnectPrompt = hasActiveSubscription && !stripeReady;

  // Get all plans
  const starterPlan = plans.find(p => p.name === 'starter');
  const growthPlan = plans.find(p => p.name === 'growth');
  const proPlan = plans.find(p => p.name === 'pro');

  // Stripe Connect prompt when user has a plan but Stripe is not connected
  if (showStripeConnectPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full">
          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t('dismiss')}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}

          {/* Header */}
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
              <CreditCard className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('stripeConnect.title')}
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-2">
              {t('stripeConnect.description')}
            </p>
            {subscription?.plan && (
              <p className="text-sm text-purple-600 font-medium">
                {t('stripeConnect.currentPlan', { plan: subscription.plan.displayName })}
              </p>
            )}
          </div>

          {/* Action */}
          <div className="px-8 pb-8">
            <Button
              onClick={handleConnectStripe}
              disabled={isConnectingStripe}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
            >
              {isConnectingStripe ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  {t('stripeConnect.button')}
                </>
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              {t('stripeConnect.hint')}
            </p>
          </div>

          {/* Footer */}
          {dismissible && (
            <div className="px-8 pb-8 text-center">
              <button
                onClick={handleDismiss}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {t('skipForNow')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={t('dismiss')}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}

        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Plans */}
        <div className="p-8 grid gap-4 md:grid-cols-3">
          {/* Starter Plan */}
          {starterPlan && (
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {starterPlan.displayName}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {starterPlan.priceCents === 0 ? t('free') : `${(starterPlan.priceCents / 100).toFixed(0)}€`}
                </span>
                {starterPlan.priceCents > 0 && <span className="text-gray-500">/{t('month')}</span>}
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {t('features.limitedProducts')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {t('features.limitedChannels')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {t('features.basicSupport')}
                </li>
              </ul>
              <Button
                onClick={() => handleSelectPlan('starter')}
                disabled={checkoutLoading === 'starter'}
                variant="outline"
                className="w-full"
              >
                {checkoutLoading === 'starter' ? t('loading') : t('selectPlan')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Growth Plan */}
          {growthPlan && (
            <div className="relative border-2 border-purple-500 rounded-xl p-6 bg-purple-50/50">
              <div className="absolute -top-3 left-4 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {t('recommended')}
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {growthPlan.displayName}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {(growthPlan.priceCents / 100).toFixed(0)}€
                </span>
                <span className="text-gray-500">/{t('month')}</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  {t('features.unlimitedProducts')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  {t('features.unlimitedChannels')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  {t('features.affiliates')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  {t('features.prioritySupport')}
                </li>
              </ul>
              <Button
                onClick={() => handleSelectPlan('growth')}
                disabled={checkoutLoading === 'growth'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {checkoutLoading === 'growth' ? t('loading') : t('selectPlan')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Pro Plan */}
          {proPlan && (
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {proPlan.displayName}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {(proPlan.priceCents / 100).toFixed(0)}€
                </span>
                <span className="text-gray-500">/{t('month')}</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  {t('features.allGrowth')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  {t('features.telegramStars')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  {t('features.customBranding')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  {t('features.apiAccess')}
                </li>
              </ul>
              <Button
                onClick={() => handleSelectPlan('pro')}
                disabled={checkoutLoading === 'pro'}
                variant="outline"
                className="w-full"
              >
                {checkoutLoading === 'pro' ? t('loading') : t('selectPlan')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {dismissible && (
          <div className="px-8 pb-8 text-center">
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {t('skipForNow')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
