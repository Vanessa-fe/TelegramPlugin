'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Login failed');
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
            TelegramPlugin
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
                Welcome back
              </h1>
              <p className="text-[#6F6E77]">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A1523]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#1A1523]">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#6F6E77]">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign up free
                </Link>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-[#6F6E77] mt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-[#1A1523]">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-[#1A1523]">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
