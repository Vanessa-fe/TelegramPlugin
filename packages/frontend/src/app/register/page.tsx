'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });
      toast.success(t('success'));
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || t('error');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFAFF] flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-xl font-bold text-[#1A1523]">
            {tCommon('appName')}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#E9E3EF] shadow-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#1A1523] mb-2">
                {t('title')}
              </h1>
              <p className="text-[#6F6E77]">
                {t('subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </p>
              )}
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#1A1523]">
                    {t('firstName')}
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder={t('firstNamePlaceholder')}
                    className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#1A1523]">
                    {t('lastName')}
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder={t('lastNamePlaceholder')}
                    className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A1523]">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder={t('emailPlaceholder')}
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1A1523]">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder={t('passwordPlaceholder')}
                  aria-describedby="password-hint"
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
                <p id="password-hint" className="text-xs text-[#6F6E77]">
                  {t('passwordHint')}
                </p>
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
              <span className="inline-flex items-center gap-2 text-sm text-[#6F6E77]">
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
              <p className="text-[#6F6E77]">
                {t('hasAccount')}{' '}
                <Link
                  href="/login"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {t('signIn')}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-[#6F6E77] mt-6">
            {t('termsNotice')}{' '}
            <Link href="/terms" className="underline hover:text-[#1A1523]">
              {t('terms')}
            </Link>{' '}
            {t('and')}{' '}
            <Link href="/privacy" className="underline hover:text-[#1A1523]">
              {t('privacy')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
