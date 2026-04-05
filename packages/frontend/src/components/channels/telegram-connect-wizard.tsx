"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Analytics } from "@/lib/analytics/events";
import { channelsApi } from "@/lib/api/channels";
import {
  ChannelType,
  VerificationStatus,
  type ChannelVerification,
  type VerificationStatusResponse,
} from "@/types/channel";

// Icons as simple components
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
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

interface TelegramConnectWizardProps {
  botUsername?: string;
}

export function TelegramConnectWizard({
  botUsername = "votre_bot",
}: TelegramConnectWizardProps) {
  const t = useTranslations("channels.wizard");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<ChannelType>(ChannelType.CHANNEL);
  const [verification, setVerification] = useState<ChannelVerification | null>(
    null,
  );
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<"bot" | "code" | null>(null);

  const isVerified = verificationStatus?.status === VerificationStatus.VERIFIED;

  // Poll for verification status
  useEffect(() => {
    if (!verification || isVerified) return;

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
  }, [verification, isVerified, t]);

  const handleCopy = useCallback(
    async (text: string, type: "bot" | "code") => {
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
      const result = await channelsApi.startVerification(type);
      setVerification(result);
      setVerificationStatus(null);
      setStep(4);
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

  const handleConfirm = async () => {
    if (!verification) return;

    setIsLoading(true);
    try {
      await channelsApi.confirmVerification(verification.id);
      Analytics.communityCreated({ platform: "telegram" });
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
    { number: 1, label: t("steps.type") },
    { number: 2, label: t("steps.create") },
    { number: 3, label: t("steps.addBot") },
    { number: 4, label: t("steps.verify") },
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

      {/* Step 1: Choose type */}
      {step === 1 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <TelegramIcon className="w-8 h-8 text-[#0088cc]" />
            <h2 className="text-xl font-semibold">{t("step1.title")}</h2>
          </div>

          <p className="text-muted-foreground mb-6">{t("step1.description")}</p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setType(ChannelType.CHANNEL)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                type === ChannelType.CHANNEL
                  ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                  : "border-gray-200 hover:border-purple-300/50 hover:bg-purple-50/60"
              }`}
            >
              <div
                className={`font-medium ${type === ChannelType.CHANNEL ? "text-purple-600" : "text-gray-900"}`}
              >
                {t("step1.channel.title")}
              </div>
              <div
                className={`text-sm ${type === ChannelType.CHANNEL ? "text-purple-600/80" : "text-gray-500"}`}
              >
                {t("step1.channel.description")}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType(ChannelType.GROUP)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                type === ChannelType.GROUP
                  ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                  : "border-gray-200 hover:border-purple-300/50 hover:bg-purple-50/60"
              }`}
            >
              <div
                className={`font-medium ${type === ChannelType.GROUP ? "text-purple-600" : "text-gray-900"}`}
              >
                {t("step1.group.title")}
              </div>
              <div
                className={`text-sm ${type === ChannelType.GROUP ? "text-purple-600/80" : "text-gray-500"}`}
              >
                {t("step1.group.description")}
              </div>
            </button>
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

      {/* Step 2: Create channel/group */}
      {step === 2 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium">
              2
            </div>
            <h2 className="text-xl font-semibold">
              {type === ChannelType.CHANNEL
                ? t("step2.titleChannel")
                : t("step2.titleGroup")}
            </h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>{t("step2.intro")}</p>

            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                {t("step2.steps.open")}{" "}
                <span className="font-medium text-[#0088cc]">Telegram</span>
              </li>
              <li>
                {type === ChannelType.CHANNEL
                  ? t("step2.steps.createChannel")
                  : t("step2.steps.createGroup")}
              </li>
              <li>{t("step2.steps.makePrivate")}</li>
            </ol>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <p className="text-amber-800 text-sm">
                <span className="font-medium">{t("step2.important")}</span>{" "}
                {type === ChannelType.CHANNEL
                  ? t("step2.privateChannelNote")
                  : t("step2.privateGroupNote")}
              </p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>
              {t("buttons.back")}
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              {t("buttons.next")}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Add bot as admin */}
      {step === 3 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium">
              3
            </div>
            <h2 className="text-xl font-semibold">{t("step3.title")}</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              {t("step3.description")}{" "}
              <span className="font-medium text-foreground">
                @{botUsername}
              </span>{" "}
              {t("step3.asAdmin")}
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-foreground">
                @{botUsername}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(`@${botUsername}`, "bot")}
              >
                {copied === "bot" ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">{t("step3.note")}</p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
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

      {/* Step 4: Verify connection */}
      {step === 4 && verification && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium">
              4
            </div>
            <h2 className="text-xl font-semibold">{t("step4.title")}</h2>
          </div>

          {/* Status indicator */}
          <div className="mb-6">
            {isVerified ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-4 py-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-medium">{t("step4.connected")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-4 py-2">
                <LoaderIcon className="w-5 h-5 animate-spin" />
                <span className="font-medium">{t("step4.waiting")}</span>
              </div>
            )}
          </div>

          {isVerified && verificationStatus ? (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {type === ChannelType.CHANNEL
                    ? t("step4.channelFound")
                    : t("step4.groupFound")}
                </div>
                <div className="font-medium text-lg">
                  {verificationStatus.telegramTitle}
                </div>
                {verificationStatus.telegramUsername && (
                  <div className="text-sm text-muted-foreground">
                    @{verificationStatus.telegramUsername}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-muted-foreground">
              <p>{t("step4.instructions")}</p>

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

              <p className="text-sm">{t("step4.postInstructions")}</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(3)}>
              {t("buttons.back")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isVerified || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 disabled:bg-gray-300 disabled:text-gray-500"
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
