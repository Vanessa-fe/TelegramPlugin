'use client';

import { useEffect, useMemo, useState } from 'react';
import { billingApi } from '@/lib/api/billing';
import type { StripeStatus } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

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
        axiosError.response?.data?.message || 'Failed to load billing status'
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
        axiosError.response?.data?.message || 'Failed to start Stripe connection'
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
        axiosError.response?.data?.message || 'Failed to open Stripe dashboard'
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[#6F6E77]">Loading billing...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1523]">Billing</h1>
        <p className="mt-1 text-[#6F6E77]">
          Connect Stripe to start receiving payments from your customers
        </p>
      </div>

      {/* SaaS subscription warning */}
      {!status.saasActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Subscription required</p>
            <p className="text-sm text-amber-700 mt-1">
              Your SaaS subscription is not active. Payments are disabled until
              you subscribe.
            </p>
          </div>
        </div>
      )}

      {/* Stripe Connect card */}
      <div className="bg-white rounded-xl border border-[#E9E3EF] overflow-hidden">
        <div className="p-6 border-b border-[#E9E3EF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1A1523]">
                Stripe Connect
              </h2>
              <p className="text-sm text-[#6F6E77]">
                Receive payments directly to your Stripe account
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status indicators */}
          <div className="space-y-3 mb-6">
            <StatusItem
              label="Account connected"
              isComplete={status.connected}
            />
            <StatusItem
              label="Charges enabled"
              isComplete={status.chargesEnabled || false}
              disabled={!status.connected}
            />
            <StatusItem
              label="Details submitted"
              isComplete={status.detailsSubmitted || false}
              disabled={!status.connected}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleConnectStripe}
              disabled={isConnecting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status.connected
                ? stripeReady
                  ? 'Update Stripe settings'
                  : 'Complete Stripe setup'
                : 'Connect Stripe'}
            </Button>
            {status.connected && (
              <Button
                variant="outline"
                onClick={handleOpenStripe}
                disabled={isOpeningStripe}
                className="border-[#E9E3EF] hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
              >
                {isOpeningStripe && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Stripe Dashboard
              </Button>
            )}
          </div>

          {/* Account ID */}
          {status.connected && status.accountId && (
            <p className="mt-4 text-xs text-[#6F6E77]">
              Account ID:{' '}
              <code className="bg-[#FDFAFF] px-1.5 py-0.5 rounded text-[#1A1523]">
                {status.accountId}
              </code>
            </p>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#FDFAFF] rounded-xl border border-[#E9E3EF] p-6">
        <h3 className="font-semibold text-[#1A1523] mb-2">
          How payments work
        </h3>
        <ul className="space-y-2 text-sm text-[#6F6E77]">
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            Customers pay through Stripe checkout
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            Funds go directly to your Stripe account
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            We charge €39/month flat fee, 0% commission
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            Stripe fees (1.4% + €0.25 for EU cards) apply separately
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  isComplete,
  disabled = false,
}: {
  label: string;
  isComplete: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {isComplete ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <div
          className={`w-5 h-5 rounded-full border-2 ${
            disabled ? 'border-gray-200' : 'border-[#E9E3EF]'
          }`}
        />
      )}
      <span
        className={`text-sm ${
          disabled
            ? 'text-gray-400'
            : isComplete
              ? 'text-[#1A1523]'
              : 'text-[#6F6E77]'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
