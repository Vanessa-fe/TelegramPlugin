'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Registration failed');
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
                Create your account
              </h1>
              <p className="text-[#6F6E77]">
                Start monetizing in minutes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#1A1523]">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Jane"
                    className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#1A1523]">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Doe"
                    className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A1523]">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1A1523]">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="h-12 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                />
                <p className="text-xs text-[#6F6E77]">
                  Must be at least 8 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            {/* Trial badge */}
            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-[#6F6E77]">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                14-day free trial • No credit card required
              </span>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[#6F6E77]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-[#6F6E77] mt-6">
            By creating an account, you agree to our{' '}
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
