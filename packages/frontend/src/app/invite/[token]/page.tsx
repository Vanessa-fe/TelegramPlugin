"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamApi } from "@/lib/api/team";
import type { TeamPublicInvite } from "@/types/team";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const t = useTranslations("invitePage");

  const [token, setToken] = useState("");
  const [invite, setInvite] = useState<TeamPublicInvite | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      try {
        const resolved = await params;
        if (cancelled) return;

        setToken(resolved.token);

        const inviteData = await teamApi.getPublicInvite(resolved.token);
        if (!cancelled) {
          setInvite(inviteData);
        }
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };

        if (!cancelled) {
          setInvite({
            valid: false,
            reason: "invalid",
            message: axiosError.response?.data?.message || t("errors.invalidInvite"),
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInvite(false);
        }
      }
    }

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [params, t]);

  async function handleAcceptInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsSubmitting(true);

    try {
      await teamApi.acceptInvite({
        token,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        password: password.trim() || undefined,
      });

      toast.success(t("toasts.accepted"));
      router.push("/login");
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toasts.acceptError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingInvite) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!invite?.valid) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border-custom bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-text-primary">{t("invalid.title")}</h1>
          <p className="mt-2 text-text-secondary">
            {invite?.message || t("errors.invalidInvite")}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="outline">{t("actions.login")}</Button>
            </Link>
            <Link href="/">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                {t("actions.home")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border-custom bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary">{t("header.title")}</h1>
        <p className="mt-2 text-text-secondary">
          {t("header.subtitle", { organizationName: invite.organizationName })}
        </p>

        <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm">
          <p>
            <strong>{t("summary.emailLabel")}:</strong> {invite.email}
          </p>
          <p>
            <strong>{t("summary.roleLabel")}:</strong> {invite.role}
          </p>
        </div>

        <form onSubmit={handleAcceptInvite} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("form.firstNameLabel")}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={isSubmitting}
                placeholder={t("form.firstNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("form.lastNameLabel")}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={isSubmitting}
                placeholder={t("form.lastNamePlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("form.passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              placeholder={t("form.passwordPlaceholder")}
            />
            <p className="text-xs text-text-secondary">{t("form.passwordHelp")}</p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("form.submitting") : t("form.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
