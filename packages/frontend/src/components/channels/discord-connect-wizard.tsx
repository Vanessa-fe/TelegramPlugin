"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { channelsApi } from "@/lib/api/channels";
import {
  ChannelProvider,
  ChannelType,
  VerificationStatus,
  type ChannelVerification,
  type VerificationStatusResponse,
} from "@/types/channel";

interface SelectedRole {
  id: string;
  name: string;
}

// Icons
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

interface DiscordConnectWizardProps {
  botInviteUrl?: string;
  discordClientId?: string;
}

export function DiscordConnectWizard({
  botInviteUrl,
  discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "",
}: DiscordConnectWizardProps) {
  const t = useTranslations("channels.discordWizard");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [verification, setVerification] = useState<ChannelVerification | null>(
    null,
  );
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatusResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<"code" | null>(null);

  const isVerified = verificationStatus?.status === VerificationStatus.VERIFIED;

  // Build bot invite URL
  const inviteUrl =
    botInviteUrl ||
    `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&permissions=268504064&scope=bot`;

  // Poll for verification status
  useEffect(() => {
    if (!verification || step < 3) return;

    const interval = setInterval(async () => {
      try {
        const status = await channelsApi.checkVerificationStatus(
          verification.id,
        );
        setVerificationStatus(status);

        if (status.status === VerificationStatus.EXPIRED) {
          toast.error(t("errors.expired"));
          clearInterval(interval);
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [verification, step, t]);

  const handleCopy = useCallback(
    async (text: string, type: "code") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        toast.success(t("copied"));
        setTimeout(() => setCopied(null), 2000);
      } catch {
        toast.error(t("errors.copyFailed"));
      }
    },
    [t],
  );

  const handleStartVerification = async () => {
    setIsLoading(true);
    try {
      const result = await channelsApi.startVerification(
        ChannelType.GROUP,
        ChannelProvider.DISCORD,
      );
      setVerification(result);
      setVerificationStatus(null);
      setStep(3);
    } catch (error) {
      console.error("Verification start error:", error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const message =
        axiosError.response?.data?.message || t("errors.startFailed");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRole = async () => {
    if (!verification || !selectedRole) return;

    setIsLoading(true);
    try {
      await channelsApi.setDiscordRole(
        verification.id,
        selectedRole.id,
        selectedRole.name,
      );
      setStep(5);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.setRoleFailed");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!verification) return;

    setIsLoading(true);
    try {
      await channelsApi.confirmDiscordVerification(verification.id);
      toast.success(t("success"));
      router.push("/dashboard/channels");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.confirmFailed");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicators
  const steps = [
    { number: 1, label: t("steps.addBot") },
    { number: 2, label: t("steps.permissions") },
    { number: 3, label: t("steps.verify") },
    { number: 4, label: t("steps.selectRole") },
    { number: 5, label: t("steps.confirm") },
  ];

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-2">
          {steps.map((s) => (
            <div
              key={s.number}
              className="flex-1 flex flex-col items-center text-center"
            >
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                  ${
                    step >= s.number
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
              >
                {step > s.number ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  s.number
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium leading-snug ${
                  step >= s.number ? "text-purple-600" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Add bot to server */}
      {step === 1 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <DiscordIcon className="w-8 h-8 text-purple-600" />
            <h2 className="text-xl font-semibold">{t("step1.title")}</h2>
          </div>

          <p className="text-muted-foreground mb-6">{t("step1.description")}</p>

          <div className="space-y-4">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <DiscordIcon className="w-5 h-5" />
              {t("step1.addBotButton")}
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
            <p className="text-xs text-muted-foreground">
              {t("step1.permissionsNote")}
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 text-sm">{t("step1.note")}</p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setStep(2)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              {t("buttons.next")}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Confirm permissions */}
      {step === 2 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium">
              2
            </div>
            <h2 className="text-xl font-semibold">{t("step2.title")}</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>{t("step2.description")}</p>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>{t("step2.permissions.manageRoles")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>{t("step2.permissions.sendMessages")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>{t("step2.permissions.viewChannels")}</span>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 text-sm">
                <span className="font-medium">{t("step2.important")}</span>{" "}
                {t("step2.rolePositionNote")}
              </p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>
              {t("buttons.back")}
            </Button>
            <Button
              onClick={handleStartVerification}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  {t("buttons.loading")}
                </>
              ) : (
                t("buttons.next")
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Verify connection */}
      {step === 3 && verification && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium">
              3
            </div>
            <h2 className="text-xl font-semibold">{t("step3.title")}</h2>
          </div>

          {/* Status indicator */}
          <div className="mb-6">
            {isVerified ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-4 py-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-medium">{t("step3.verified")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-4 py-2">
                <LoaderIcon className="w-5 h-5 animate-spin" />
                <span className="font-medium">{t("step3.waiting")}</span>
              </div>
            )}
          </div>

          {isVerified && verificationStatus ? (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("step3.serverFound")}
                </div>
                <div className="font-medium text-lg">
                  {verificationStatus.discordGuildName}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-muted-foreground">
              <p>{t("step3.instructions")}</p>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-foreground text-center">
                  {verification.code}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(verification.code, "code")}
                >
                  {copied === "code" ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <p className="text-sm">{t("step3.postInstructions")}</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              {t("buttons.back")}
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!isVerified}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {t("buttons.next")}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Select role */}
      {step === 4 && verification && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium">
              4
            </div>
            <h2 className="text-xl font-semibold">{t("step4.title")}</h2>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">{t("step4.description")}</p>

            {/* Role input (manual for now, later can be populated from bot) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("step4.roleLabel")}</label>
              <input
                type="text"
                placeholder={t("step4.roleIdPlaceholder")}
                className="w-full px-4 py-2 border rounded-lg"
                value={selectedRole?.id || ""}
                onChange={(e) =>
                  setSelectedRole({
                    id: e.target.value,
                    name: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                {t("step4.roleIdHelp")}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 text-sm">{t("step4.note")}</p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(3)}>
              {t("buttons.back")}
            </Button>
            <Button
              onClick={handleSetRole}
              disabled={!selectedRole?.id || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  {t("buttons.loading")}
                </>
              ) : (
                t("buttons.next")
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && verification && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium">
              5
            </div>
            <h2 className="text-xl font-semibold">{t("step5.title")}</h2>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">{t("step5.description")}</p>

            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("step5.server")}</span>
                <span className="font-medium">
                  {verificationStatus?.discordGuildName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("step5.role")}</span>
                <span className="font-medium">
                  {selectedRole?.name || verificationStatus?.discordRoleName}
                </span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">{t("step5.readyNote")}</p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(4)}>
              {t("buttons.back")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  {t("buttons.loading")}
                </>
              ) : (
                t("buttons.connect")
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
