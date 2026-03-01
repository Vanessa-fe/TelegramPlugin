'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const tRequirements = useTranslations('auth.passwordStrength.requirements');
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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef(password);
  const confirmPasswordRef = useRef(confirmPassword);

  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  useEffect(() => {
    confirmPasswordRef.current = confirmPassword;
  }, [confirmPassword]);

  const syncAutofilledValues = useCallback(() => {
    const nextPassword = passwordInputRef.current?.value ?? '';
    const nextConfirm = confirmInputRef.current?.value ?? '';

    if (nextPassword !== passwordRef.current) {
      setPassword(nextPassword);
    }
    if (nextConfirm !== confirmPasswordRef.current) {
      setConfirmPassword(nextConfirm);
    }
  }, []);

  useEffect(() => {
    syncAutofilledValues();

    // Password managers can update inputs without firing React onChange.
    const intervalId = window.setInterval(syncAutofilledValues, 250);
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 6000);
    const handleFocus = () => syncAutofilledValues();
    const handleVisibility = () => syncAutofilledValues();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncAutofilledValues]);

  const requirements = useMemo(() => {
    const tests = [
      {
        id: 'minLength',
        label: tRequirements('minLength'),
        valid: password.length >= 10,
      },
      {
        id: 'uppercase',
        label: tRequirements('uppercase'),
        valid: /[A-Z]/.test(password),
      },
      {
        id: 'lowercase',
        label: tRequirements('lowercase'),
        valid: /[a-z]/.test(password),
      },
      {
        id: 'number',
        label: tRequirements('number'),
        valid: /[0-9]/.test(password),
      },
    ];

    return tests;
  }, [password, tRequirements]);

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
                      ref={passwordInputRef}
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                      onBlur={syncAutofilledValues}
                      required
                      disabled={isLoading}
                      placeholder={t('passwordPlaceholder')}
                      className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                    />
                    <p className="text-xs text-text-secondary">{t('passwordHint')}</p>
                    <div className="space-y-1">
                      {requirements.map((req) => (
                        <div
                          key={req.id}
                          className={
                            req.valid
                              ? 'flex items-center gap-2 text-xs rounded-md px-2 py-1 bg-green-50 text-green-800 font-medium'
                              : 'flex items-center gap-2 text-xs rounded-md px-2 py-1 bg-gray-100 text-gray-700'
                          }
                        >
                          {req.valid ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-gray-500" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-text-primary">
                      {t('confirmPassword')}
                    </Label>
                    <Input
                      ref={confirmInputRef}
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                      onBlur={syncAutofilledValues}
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
