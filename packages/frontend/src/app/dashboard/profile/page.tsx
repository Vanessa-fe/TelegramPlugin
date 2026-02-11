"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const { user, updateProfile, updatePassword } = useAuth();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setOrgId(user.organizationId ?? null);
    }
  }, [user]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    const loadOrganization = async () => {
      try {
        const org = await organizationsApi.findOne(orgId);
        if (!cancelled) {
          setOrgSlug(org.slug);
        }
      } catch {
        if (!cancelled) {
          toast.error(tCommon("error"));
        }
      }
    };

    loadOrganization();
    return () => {
      cancelled = true;
    };
  }, [orgId, tCommon]);

  const normalizedSlug = useMemo(() => orgSlug.trim().toLowerCase(), [orgSlug]);

  const validateSlug = (value: string): string | null => {
    if (!value) return t("slugRequired");
    if (!/^[a-z0-9-]+$/.test(value)) return t("slugInvalid");
    return null;
  };

  const handleSaveProfile = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailChanged = Boolean(user?.email && trimmedEmail !== user.email);

    if (emailChanged && !emailPassword) {
      toast.error(t("emailPasswordHelp"));
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        ...(emailChanged
          ? {
              email: trimmedEmail,
              currentPassword: emailPassword || undefined,
            }
          : {}),
      });
      setEmailPassword("");
      toast.success(t("profileUpdated"));
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || tCommon("error"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSlug = async () => {
    const error = validateSlug(normalizedSlug);
    setSlugError(error);
    if (error || !orgId) return;

    setSavingSlug(true);
    try {
      await organizationsApi.update(orgId, { slug: normalizedSlug });
      setOrgSlug(normalizedSlug);
      toast.success(t("creatorUpdated"));
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message || t("slugTaken") || tCommon("error");
      toast.error(message);
    } finally {
      setSavingSlug(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("passwordUpdated"));
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || tCommon("error"));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("personalTitle")}</CardTitle>
          <CardDescription>{t("personalDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              {t("emailPasswordHelp")}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="emailPassword">{t("currentPassword")}</Label>
            <Input
              id="emailPassword"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {t("saveProfile")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("creatorTitle")}</CardTitle>
          <CardDescription>{t("creatorDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="creatorSlug">{t("creatorSlug")}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                /page/
              </span>
              <Input
                id="creatorSlug"
                value={orgSlug}
                onChange={(e) => {
                  const next = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-");
                  setOrgSlug(next);
                  setSlugError(null);
                }}
                className={slugError ? "border-destructive h-11" : "h-11"}
              />
            </div>
            {slugError ? (
              <p className="text-xs text-destructive">{slugError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("creatorHelp")}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSlug} disabled={savingSlug}>
              {t("saveCreator")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("passwordTitle")}</CardTitle>
          <CardDescription>{t("passwordDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="newPassword">{t("newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSavePassword} disabled={savingPassword}>
              {t("savePassword")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
