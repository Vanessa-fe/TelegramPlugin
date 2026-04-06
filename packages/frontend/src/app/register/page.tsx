'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { OAuthDivider } from '@/components/auth/oauth-divider';
import { ORG_CURRENCY_OPTIONS } from '@/lib/currencies';
import { authApi } from '@/lib/api/auth';
import { Analytics } from '@/lib/analytics/events';

const PRICING_PLAN_DETAILS = {
  starter: { price: 0, currency: 'EUR' },
  growth: { price: 29, currency: 'EUR' },
  pro: { price: 99, currency: 'EUR' },
} as const;

type PricingPlanName = keyof typeof PRICING_PLAN_DETAILS;

function isPricingPlanName(value: string | null): value is PricingPlanName {
  return value === 'starter' || value === 'growth' || value === 'pro';
}

function generateSecurePassword(length = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

type ErrorMessage =
  | string
  | string[]
  | { _errors?: string[]; [key: string]: unknown }
  | undefined;

function extractZodErrors(message: ErrorMessage): string[] {
  if (!message) return [];
  if (typeof message === 'string') return [message];
  if (Array.isArray(message)) return message.filter(Boolean);
  if (typeof message !== 'object') return [];

  const errors: string[] = [];
  const asRecord = message as Record<string, unknown>;
  const rootErrors = (asRecord._errors as string[] | undefined) ?? [];
  if (rootErrors.length > 0) {
    errors.push(...rootErrors);
  }

  Object.values(asRecord).forEach((value) => {
    if (
      value &&
      typeof value === 'object' &&
      '_errors' in value &&
      Array.isArray((value as { _errors?: string[] })._errors)
    ) {
      errors.push(...((value as { _errors?: string[] })._errors ?? []));
    }
  });

  return errors;
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as {
    response?: { data?: { message?: ErrorMessage; error?: string } | string };
    message?: string;
  };

  const responseData = axiosError.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const serverMessage = responseData.message;
    const zodErrors = extractZodErrors(serverMessage);
    if (zodErrors.length > 0) {
      return zodErrors.join(' ');
    }

    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }

    if (typeof responseData.error === 'string' && responseData.error.trim()) {
      return responseData.error;
    }
  }

  if (typeof axiosError.message === 'string' && axiosError.message.trim()) {
    return axiosError.message;
  }

  return fallback;
}

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const t = useTranslations('auth.register');
  const tOAuth = useTranslations('auth.oauth');
  const tCommon = useTranslations('common');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    currency: 'EUR',
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const trackedPlanSelectionRef = useRef<string | null>(null);
  const selectedPlanParam = searchParams.get('plan');
  const selectedPlan = isPricingPlanName(selectedPlanParam)
    ? selectedPlanParam
    : null;
  const planSource = searchParams.get('source') || 'register';

  // Handle OAuth error from redirect
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError === 'oauth_failed') {
      setError(tOAuth('error'));
      toast.error(tOAuth('error'));
    }
  }, [searchParams, tOAuth]);

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }

    const trackingKey = `${selectedPlan}:${planSource}`;
    if (trackedPlanSelectionRef.current === trackingKey) {
      return;
    }

    trackedPlanSelectionRef.current = trackingKey;
    Analytics.planSelected({
      plan: selectedPlan,
      price: PRICING_PLAN_DETAILS[selectedPlan].price,
      currency: PRICING_PLAN_DETAILS[selectedPlan].currency,
      source: planSource,
    });
  }, [planSource, selectedPlan]);

  const handleSuggestPassword = useCallback(() => {
    const newPassword = generateSecurePassword(16);
    setPassword(newPassword);
    setShowPassword(true);
    toast.success(t('passwordGenerated'));
  }, [t]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await register({
        email: formData.email,
        password: password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        currency: formData.currency,
      });
      setSubmittedEmail(result.email || formData.email.trim().toLowerCase());
      toast.success(t('success'));
      Analytics.userSignedUp(
        selectedPlan ? { plan: selectedPlan } : undefined,
      );

      // Send registration_success event to GTM
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'registration_success',
          method: 'email',
        });
      }
    } catch (err) {
      const msg = extractApiErrorMessage(err, t('error'));
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!submittedEmail) return;

    setIsLoading(true);
    try {
      await authApi.resendVerification({ email: submittedEmail });
      toast.success(t('resendSuccess'));
    } catch {
      toast.error(t('resendError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center" aria-label={tCommon('appName')}>
            <Image
              src="/logo_160.svg"
              alt=""
              width={40}
              height={40}
            />
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-border-custom shadow-sm p-8">
            {!submittedEmail ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-text-primary mb-2">
                    {t('title')}
                  </h1>
                  <p className="text-text-secondary">
                    {t('subtitle')}
                  </p>
                </div>

                {/* OAuth Buttons */}
                <OAuthButtons mode="register" disabled={isLoading} />

                <OAuthDivider />

                <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
                  {error && (
                    <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {error}
                    </p>
                  )}
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-text-primary">
                        {t('firstName')}
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder={t('firstNamePlaceholder')}
                        className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-text-primary">
                        {t('lastName')}
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder={t('lastNamePlaceholder')}
                        className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-text-primary">
                      {t('email')}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      placeholder={t('emailPlaceholder')}
                      className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-text-primary">
                      {t('password')}
                    </Label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        placeholder={t('passwordPlaceholder')}
                        className="flex h-12 w-full rounded-md border border-border-custom bg-white px-3 py-2 pr-10 text-base ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary">{t('passwordHint')}</p>
                    <button
                      type="button"
                      onClick={handleSuggestPassword}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('suggestPassword')}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-text-primary">
                      {t('currency')}
                    </Label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="h-12 w-full rounded-md border border-border-custom bg-white px-3 text-sm focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                    >
                      {ORG_CURRENCY_OPTIONS.map((currency) => (
                        <option key={currency} value={currency}>
                          {t(`currencyOptions.${currency}`)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-text-secondary">{t('currencyHelp')}</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? t('submitting') : t('submit')}
                  </Button>
                </form>

                {/* Trial badge */}
                <div className="mt-6 text-center">
                  <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t('trialBadge')}
                  </span>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-text-secondary">
                    {t('hasAccount')}{' '}
                    <Link
                      href="/login"
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      {t('signIn')}
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4" role="status">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  {t('successTitle')}
                </h2>
                <p className="text-text-secondary mb-6">
                  {t('successDescription')}{' '}
                  <span className="font-medium text-text-primary">
                    {submittedEmail}
                  </span>
                </p>
                <p className="text-sm text-text-secondary mb-6">
                  {t('successHint')}
                </p>
                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                  >
                    {isLoading ? t('resending') : t('resend')}
                  </Button>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full h-12 border border-border-custom text-text-primary font-medium rounded-lg hover:bg-surface transition-colors"
                  >
                    {t('backToLogin')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-text-secondary mt-6">
            {t('termsNotice')}{' '}
            <Link href="/terms" className="underline hover:text-text-primary">
              {t('terms')}
            </Link>{' '}
            {t('and')}{' '}
            <Link href="/privacy" className="underline hover:text-text-primary">
              {t('privacy')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
