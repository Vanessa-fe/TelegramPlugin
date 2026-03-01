'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/contexts/auth-context';

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const token = useMemo(() => {
    const t = searchParams.get('token');
    // Clean token from URL after reading to prevent exposure in history/bookmarks
    if (typeof window !== 'undefined' && t) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    return t;
  }, [searchParams]);

  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError(t('missingToken'));
      return;
    }
    setStatus('idle');
    setError('');
  }, [token, t]);

  async function handleVerifyEmail() {
    if (!token || status === 'loading') {
      return;
    }

    setStatus('loading');
    try {
      await authApi.verifyEmail({ token });
      await refreshProfile();
      setStatus('success');
      toast.success(t('toastSuccess'));
    } catch (err) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      const message = axiosError.response?.data?.message || t('toastError');
      setStatus('error');
      setError(message);
      toast.error(message);
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
          <div className="bg-white rounded-2xl border border-border-custom shadow-sm p-8 text-center">
            {status === 'idle' && (
              <>
                <h1 className="text-2xl font-bold text-text-primary mt-2 mb-2">
                  {t('readyTitle')}
                </h1>
                <p className="text-text-secondary mb-6">{t('readyDescription')}</p>
                <Button
                  type="button"
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  onClick={handleVerifyEmail}
                >
                  {t('readyCta')}
                </Button>
              </>
            )}

            {status === 'loading' && (
              <>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
                <h1 className="text-2xl font-bold text-text-primary mt-6 mb-2">
                  {t('loadingTitle')}
                </h1>
                <p className="text-text-secondary">{t('loadingDescription')}</p>
              </>
            )}

            {status === 'success' && (
              <>
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
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {t('successTitle')}
                </h1>
                <p className="text-text-secondary mb-6">{t('successDescription')}</p>
                <Button
                  type="button"
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  onClick={() => router.push('/dashboard')}
                >
                  {t('successCta')}
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {t('errorTitle')}
                </h1>
                <p className="text-text-secondary mb-6">{error || t('toastError')}</p>
                <div className="space-y-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    {t('backToRegister')}
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full h-12 border border-border-custom text-text-primary font-medium rounded-lg hover:bg-surface transition-colors"
                  >
                    {t('backToLogin')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
