'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setIsSubmitted(true);
      toast.success(t('toastSuccess'));
    } catch {
      toast.error(t('toastError'));
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
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToLogin')}
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-border-custom shadow-sm p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary mb-2">
                    {t('title')}
                  </h1>
                  <p className="text-text-secondary">
                    {t('subtitle')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-text-primary">
                      {t('email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder={t('emailPlaceholder')}
                      className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? t('sending') : t('submit')}
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
                  {t('successDescription')}{' '}
                  <span className="font-medium text-text-primary">{email}</span>
                </p>
                <p className="text-sm text-text-secondary mb-6">
                  {t('successHint')}{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {t('tryAgain')}
                  </button>
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {t('backToLogin')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
