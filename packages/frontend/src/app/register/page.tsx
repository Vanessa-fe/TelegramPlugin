'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { OAuthDivider } from '@/components/auth/oauth-divider';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength';
import { ORG_CURRENCY_OPTIONS } from '@/lib/currencies';
import { authApi } from '@/lib/api/auth';

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
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  // Sync password state with DOM value (for Chrome autofill)
  const syncPasswordValue = useCallback(() => {
    const domValue = passwordInputRef.current?.value ?? '';
    setPassword((prev) => (prev === domValue ? prev : domValue));
  }, []);

  // Poll for autofill changes
  useEffect(() => {
    const intervalId = window.setInterval(syncPasswordValue, 300);
    return () => window.clearInterval(intervalId);
  }, [syncPasswordValue]);

  // Handle OAuth error from redirect
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError === 'oauth_failed') {
      setError(tOAuth('error'));
      toast.error(tOAuth('error'));
    }
  }, [searchParams, tOAuth]);

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

    // Read password directly from DOM to handle Chrome autofill
    const passwordValue = passwordInputRef.current?.value ?? '';

    try {
      const result = await register({
        email: formData.email,
        password: passwordValue,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        currency: formData.currency,
      });
      setSubmittedEmail(result.email || formData.email.trim().toLowerCase());
      toast.success(t('success'));

      // Send registration_success event to GTM
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'registration_success',
          method: 'email',
        });
      }
    } catch (err) {
      const axiosError = err as {
        response?: { data?: { message?: ErrorMessage } };
      };
      const serverMessage = axiosError.response?.data?.message;
      const zodErrors = extractZodErrors(serverMessage);
      const msg =
        zodErrors.length > 0
          ? zodErrors.join(' ')
          : typeof serverMessage === 'string'
            ? serverMessage
            : t('error');
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
                    <input
                      ref={passwordInputRef}
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                      disabled={isLoading}
                      placeholder={t('passwordPlaceholder')}
                      aria-describedby="password-strength"
                      className="flex h-12 w-full rounded-md border border-border-custom bg-white px-3 py-2 text-base ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                    <p className="text-xs text-text-secondary">{t('passwordHint')}</p>
                    <PasswordStrengthIndicator password={password} />
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
