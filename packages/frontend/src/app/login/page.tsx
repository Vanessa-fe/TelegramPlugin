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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast.success(t('success'));
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || t('error'));
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A1523]">
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
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#1A1523]">
                    {t('password')}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder={t('passwordPlaceholder')}
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? t('submitting') : t('submit')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#6F6E77]">
                {t('noAccount')}{' '}
                <Link
                  href="/register"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {t('signUp')}
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
