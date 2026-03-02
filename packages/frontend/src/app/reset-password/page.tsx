'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/contexts/auth-context';

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

  const fields = ['token', 'newPassword'];
  fields.forEach((field) => {
    const fieldErrors = (asRecord[field] as { _errors?: string[] } | undefined)
      ?._errors;
    if (fieldErrors?.length) {
      errors.push(...fieldErrors);
    }
  });

  return errors;
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const token = useMemo(() => {
    const t = searchParams.get('token') ?? '';
    // Clean token from URL after reading to prevent exposure in history/bookmarks
    if (typeof window !== 'undefined' && t) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    return t;
  }, [searchParams]);
  const tokenMissing = !token;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Read passwords directly from DOM
    const passwordInput = document.querySelector('input[name="new-password"]') as HTMLInputElement;
    const confirmInput = document.querySelector('input[name="confirm-password"]') as HTMLInputElement;
    const nextPassword = passwordInput?.value ?? '';
    const nextConfirmPassword = confirmInput?.value ?? '';

    if (tokenMissing) {
      setError(t('missingToken'));
      return;
    }

    if (!nextPassword.trim()) {
      setError(t('passwordRequired'));
      return;
    }

    if (nextPassword !== nextConfirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword: nextPassword });
      await refreshProfile();
      setIsSubmitted(true);
      toast.success(t('toastSuccess'));
    } catch (err) {
      const axiosError = err as {
        response?: { data?: { message?: ErrorMessage } };
      };
      const serverMessage = axiosError.response?.data?.message;
      const zodErrors = extractZodErrors(serverMessage);
      const msg =
        zodErrors[0] ||
        (typeof serverMessage === 'string' ? serverMessage : t('toastError'));
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToLogin')}
          </Link>

          <div className="bg-white rounded-2xl border border-border-custom shadow-sm p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary mb-2">
                    {t('title')}
                  </h1>
                  <p className="text-text-secondary">{t('subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading} noValidate>
                  {error && (
                    <p
                      role="alert"
                      className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      {error}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-text-primary">
                      {t('password')}
                    </Label>
                    <input
                      id="new-password"
                      name="new-password"
                      type="password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      placeholder={t('passwordPlaceholder')}
                      className="flex h-12 w-full rounded-md border border-border-custom bg-white px-3 py-2 text-base ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                    <p className="text-xs text-text-secondary">{t('passwordHint')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-text-primary">
                      {t('confirmPassword')}
                    </Label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="off"
                      disabled={isLoading}
                      placeholder={t('confirmPlaceholder')}
                      className="flex h-12 w-full rounded-md border border-border-custom bg-white px-3 py-2 text-base ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    disabled={isLoading || tokenMissing}
                  >
                    {isLoading ? t('submitting') : t('submit')}
                  </Button>
                </form>
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
                  {t('successDescription')}
                </p>
                <Button
                  type="button"
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  onClick={() => router.push('/dashboard')}
                >
                  {t('successCta')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
