'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/contexts/auth-context';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const token = searchParams.get('token') ?? '';
  const tokenMissing = !token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (tokenMissing) {
      setError(t('missingToken'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      await refreshProfile();
      setIsSubmitted(true);
      toast.success(t('toastSuccess'));
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || t('toastError');
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
          <Link href="/" className="text-xl font-bold text-text-primary">
            {tCommon('appName')}
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

                <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
                  {error && (
                    <p
                      role="alert"
                      className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      {error}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-text-primary">
                      {t('password')}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder={t('passwordPlaceholder')}
                      className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                    />
                    <p className="text-xs text-text-secondary">{t('passwordHint')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-text-primary">
                      {t('confirmPassword')}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder={t('confirmPlaceholder')}
                      className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
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
