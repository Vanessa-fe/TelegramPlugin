'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement API call to /auth/forgot-password
      // await apiClient.post('/auth/forgot-password', { email });

      // Simulate success for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast.success('Reset link sent');
    } catch {
      toast.error('Failed to send reset link. Please try again.');
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
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#6F6E77] hover:text-[#1A1523] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#E9E3EF] shadow-sm p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#1A1523] mb-2">
                    Forgot your password?
                  </h1>
                  <p className="text-[#6F6E77]">
                    No worries. Enter your email and we&apos;ll send you a reset link.
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

                  <Button
                    type="submit"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#1A1523] mb-2">
                  Check your email
                </h2>
                <p className="text-[#6F6E77] mb-6">
                  We sent a password reset link to{' '}
                  <span className="font-medium text-[#1A1523]">{email}</span>
                </p>
                <p className="text-sm text-[#6F6E77] mb-6">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    try again
                  </button>
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Back to login
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
