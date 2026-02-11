'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { billingApi } from '@/lib/api/billing';
import { channelsApi } from '@/lib/api/channels';
import { productsApi } from '@/lib/api/products';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import type { StripeStatus } from '@/types/billing';

type ChecklistState = {
  stripe: StripeStatus | null;
  productsCount: number;
  channelsCount: number;
  subscriptionsCount: number;
};

export function GettingStartedChecklist() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [state, setState] = useState<ChecklistState>({
    stripe: null,
    productsCount: 0,
    channelsCount: 0,
    subscriptionsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadChecklist() {
      const [stripeResult, productsResult, channelsResult, subscriptionsResult] =
        await Promise.allSettled([
          billingApi.getStripeStatus(),
          productsApi.findAll(),
          channelsApi.findAll(),
          subscriptionsApi.findAll(),
        ]);

      if (!isMounted) return;

      setState({
        stripe:
          stripeResult.status === 'fulfilled' ? stripeResult.value : null,
        productsCount:
          productsResult.status === 'fulfilled' ? productsResult.value.length : 0,
        channelsCount:
          channelsResult.status === 'fulfilled' ? channelsResult.value.length : 0,
        subscriptionsCount:
          subscriptionsResult.status === 'fulfilled'
            ? subscriptionsResult.value.length
            : 0,
      });
      setIsLoading(false);
    }

    loadChecklist();

    return () => {
      isMounted = false;
    };
  }, []);

  const stripeReady = useMemo(() => {
    if (!state.stripe?.connected) return false;
    return Boolean(state.stripe.chargesEnabled && state.stripe.detailsSubmitted);
  }, [state.stripe]);

  const createProductDone = state.productsCount > 0;
  const connectChannelDone = state.channelsCount > 0;
  const promoteDone = state.subscriptionsCount > 0;

  return (
    <div className="bg-white rounded-xl border-border-custom p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">
        {t('gettingStarted.title')}
      </h2>

      {isLoading && (
        <p className="text-sm text-text-secondary mb-3">
          {tCommon('loading')}
        </p>
      )}

      <div className="space-y-3">
        <ChecklistItem
          label={t('gettingStarted.accountCreated')}
          completed={true}
          href="/dashboard"
        />
        <ChecklistItem
          label={t('gettingStarted.connectPayment')}
          completed={stripeReady}
          href="/dashboard/billing"
        />
        <ChecklistItem
          label={t('gettingStarted.createProduct')}
          completed={createProductDone}
          href="/dashboard/products/new"
        />
        <ChecklistItem
          label={t('gettingStarted.connectChannel')}
          completed={connectChannelDone}
          href="/dashboard/channels/new"
        />
        <ChecklistItem
          label={t('gettingStarted.promoteProduct')}
          completed={promoteDone}
          href="/dashboard/promote"
        />
      </div>
    </div>
  );
}

function ChecklistItem({
  label,
  completed,
  href,
}: {
  label: string;
  completed: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          completed
            ? 'bg-purple-600 text-white'
            : 'border-2 border-border-custom group-hover:border-purple-300'
        }`}
      >
        {completed && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          completed ? 'text-text-secondary line-through' : 'text-text-primary'
        }`}
      >
        {label}
      </span>
      {!completed && (
        <ArrowUpRight className="w-4 h-4 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Link>
  );
}
