"use client";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { OAuthDivider } from "@/components/auth/oauth-divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const t = useTranslations("auth.login");
  const tOAuth = useTranslations("auth.oauth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle OAuth error from redirect
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError === "oauth_failed") {
      setError(tOAuth("error"));
      toast.error(tOAuth("error"));
    }
  }, [searchParams, tOAuth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login({ email, password });
      toast.success(t("success"));
      router.push("/dashboard");
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || t("error");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-xl font-bold text-text-primary">
            {tCommon("appName")}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-border-custom shadow-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {t("title")}
              </h1>
              <p className="text-text-secondary">{t("subtitle")}</p>
            </div>

            {/* OAuth Buttons */}
            <OAuthButtons mode="login" disabled={isLoading} />

            <OAuthDivider />

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              aria-busy={isLoading}
            >
              {error && (
                <p
                  role="alert"
                  className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-primary">
                  {t("email")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder={t("emailPlaceholder")}
                  className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-text-primary">
                    {t("password")}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder={t("passwordPlaceholder")}
                  className="h-12 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? t("submitting") : t("submit")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-text-secondary">
                {t("noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {t("signUp")}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-text-secondary mt-6">
            {t("termsNotice")}{" "}
            <Link href="/terms" className="underline hover:text-text-primary">
              {t("terms")}
            </Link>{" "}
            {t("and")}{" "}
            <Link href="/privacy" className="underline hover:text-text-primary">
              {t("privacy")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
