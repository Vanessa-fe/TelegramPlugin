"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { billingApi } from "@/lib/api/billing";
import type { PublicPlan, PublicProduct } from "@/lib/api/storefront";
import { Check, ShieldCheck, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PlanInterval = PublicPlan["interval"];

type CheckoutPageContentProps = {
  productKey: string;
  fetchProduct: () => Promise<PublicProduct>;
};

export function CheckoutPageContent({
  productKey,
  fetchProduct,
}: CheckoutPageContentProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("checkout");
  const tIntervals = useTranslations("intervals");
  const intervalLabels: Record<PlanInterval, string> = {
    ONE_TIME: tIntervals("ONE_TIME"),
    DAY: tIntervals("DAY"),
    WEEK: tIntervals("WEEK"),
    MONTH: tIntervals("MONTH"),
    QUARTER: tIntervals("QUARTER"),
    YEAR: tIntervals("YEAR"),
  };

  // Customer info form
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe" | "telegram_stars"
  >("stripe");
  const brandColor = "#990FFA";
  const brandHover = "#7D0CC8";
  const brandDisabledBg = "#E8D9FB";
  const brandDisabledText = "#6E35C9";
  const [focusedField, setFocusedField] = useState<
    "telegram" | "displayName" | "email" | null
  >(null);
  const inputFocusStyle =
    focusedField === null
      ? undefined
      : {
          outline: "none",
          borderColor: brandColor,
          boxShadow: `0 0 0 3px ${brandColor}33`,
        };

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productKey]);

  useEffect(() => {
    // Pre-fill from URL params if available
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");
    const telegramParam = searchParams.get("telegram");
    const planParam = searchParams.get("plan");

    if (emailParam) setEmail(emailParam);
    if (nameParam) setDisplayName(nameParam);
    if (telegramParam) setTelegramUsername(telegramParam);

    // Pre-select plan from URL if specified
    if (planParam && product) {
      const plan = product.plans.find((p) => p.id === planParam);
      if (plan) setSelectedPlan(plan);
    }
  }, [searchParams, product]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProduct();
      setProduct(data);

      // Auto-select if only one plan
      if (data.plans.length === 1) {
        setSelectedPlan(data.plans[0]);
      }
    } catch (err) {
      console.error(err);
      setError(t("errors.productNotFound"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!selectedPlan) {
      toast.error(t("errors.selectPlan"));
      return;
    }

    if (paymentMethod === "stripe") {
      if (!telegramUsername) {
        toast.error(t("form.telegramRequired"));
        return;
      }

      try {
        setSubmitting(true);
        const response = await billingApi.createCheckout({
          planId: selectedPlan.id,
          customer: {
            telegramUsername: telegramUsername,
            displayName: displayName || undefined,
            email: email || undefined,
          },
        });

        // Redirect to Stripe checkout
        window.location.href = response.url;
      } catch (error) {
        console.error(error);
        toast.error(t("errors.checkoutFailed"));
        setSubmitting(false);
      }
    } else if (paymentMethod === "telegram_stars") {
      if (!telegramUsername) {
        toast.error(t("form.telegramRequired"));
        return;
      }

      // For Telegram Stars, show instructions to use the bot
      toast.info(t("telegramStarsInstructions", { planId: selectedPlan.id }), {
        duration: 10000,
      });
      setSubmitting(false);
    }
  }

  function formatPrice(priceCents: number, currency: string): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("unavailable.title")}
          </h1>
          <p className="mt-2 text-gray-600">
            {error || t("unavailable.description")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm text-gray-500 mb-2">
            {t("offeredBy", { name: product.organization.name })}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {product.description}
            </p>
          )}
          {product.channels.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>{t("accessTo")}</span>
              {product.channels.map((channel) => (
                <span
                  key={channel.id}
                  className="inline-flex items-center gap-1 bg-[#F3E8FF] text-[#990FFA] px-2 py-1 rounded-full text-xs font-medium"
                >
                  {channel.provider === "TELEGRAM" ? "📱" : "💬"}
                  {channel.title || t("channelFallback")}
                </span>
              ))}
            </div>
          )}
        </div>

        {product.plans.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">{t("noPlans")}</p>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Plans selection - 3 columns */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("choosePlan")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {product.plans.map((plan, index) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  return (
                    <Card
                      key={plan.id}
                      className={`p-6 cursor-pointer transition-all relative ${
                        isSelected
                          ? "bg-[#F7F1FF] shadow-lg"
                          : "hover:shadow-md hover:border-[#990FFA]"
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: brandColor,
                              boxShadow: `0 0 0 2px ${brandColor}, 0 16px 30px rgba(17, 24, 39, 0.12)`,
                            }
                          : undefined
                      }
                      onClick={() => setSelectedPlan(plan)}
                    >
                    {index === 0 && product.plans.length > 1 && (
                      <div
                        className="absolute -top-3 left-4 text-white text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: brandColor }}
                      >
                        {t("popular")}
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {plan.name}
                          </h3>
                          {isSelected && (
                            <Check className="h-5 w-5 text-[#990FFA]" />
                          )}
                        </div>
                        {plan.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {plan.description}
                          </p>
                        )}
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatPrice(plan.priceCents, plan.currency)}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {intervalLabels[plan.interval]}
                          </span>
                        </div>
                        {plan.trialPeriodDays && (
                          <p className="mt-2 text-sm text-green-600 font-medium">
                            {t("freeTrial", { days: plan.trialPeriodDays })}
                          </p>
                        )}
                        {plan.accessDurationDays && (
                          <p className="mt-1 text-sm text-gray-500">
                            {t("accessDuration", {
                              days: plan.accessDurationDays,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Customer info form - 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("finalize")}
              </h2>
              <Card className="p-6 space-y-4">
                <div>
                  <Label htmlFor="telegram">{t("form.telegram")} *</Label>
                  <Input
                    id="telegram"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder={t("form.telegramPlaceholder")}
                    required
                    onFocus={() => setFocusedField("telegram")}
                    onBlur={() => setFocusedField(null)}
                    style={
                      focusedField === "telegram" ? inputFocusStyle : undefined
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("form.telegramHelp")}
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayName">{t("form.name")}</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("form.namePlaceholder")}
                    onFocus={() => setFocusedField("displayName")}
                    onBlur={() => setFocusedField(null)}
                    style={
                      focusedField === "displayName"
                        ? inputFocusStyle
                        : undefined
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t("form.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("form.emailPlaceholder")}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    style={
                      focusedField === "email" ? inputFocusStyle : undefined
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("form.emailHelp")}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-3 block">
                    {t("payment.title")}
                  </Label>
                  <div className="space-y-2">
                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        paymentMethod === "stripe"
                          ? "border-[#990FFA] bg-[#F7F1FF]"
                          : "border-gray-200 hover:border-[#990FFA]"
                      }`}
                      onClick={() => setPaymentMethod("stripe")}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="stripe"
                          checked={paymentMethod === "stripe"}
                          onChange={() => setPaymentMethod("stripe")}
                          className="h-4 w-4"
                          style={{ accentColor: brandColor }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {t("payment.card")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        paymentMethod === "telegram_stars"
                          ? "border-[#990FFA] bg-[#F7F1FF]"
                          : "border-gray-200 hover:border-[#990FFA]"
                      }`}
                      onClick={() => setPaymentMethod("telegram_stars")}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="telegram_stars"
                          checked={paymentMethod === "telegram_stars"}
                          onChange={() => setPaymentMethod("telegram_stars")}
                          className="h-4 w-4"
                          style={{ accentColor: brandColor }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {t("payment.telegramStars")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPlan && (
                  <div className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{selectedPlan.name}</span>
                      <span className="font-semibold text-slate-900">
                        {formatPrice(
                          selectedPlan.priceCents,
                          selectedPlan.currency,
                        )}
                        <span className="ml-1 text-xs text-slate-500">
                          {intervalLabels[selectedPlan.interval]}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {(!selectedPlan || !telegramUsername) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {!selectedPlan
                      ? t("errors.selectPlan")
                      : t("form.telegramRequired")}
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={!selectedPlan || submitting || !telegramUsername}
                  className="w-full h-12 text-base font-semibold transition-colors hover:brightness-95 disabled:opacity-100"
                  size="lg"
                  style={
                    selectedPlan && telegramUsername && !submitting
                      ? { backgroundColor: brandColor, color: "#FFFFFF" }
                      : {
                          backgroundColor: brandDisabledBg,
                          color: brandDisabledText,
                        }
                  }
                >
                  {submitting
                    ? t("cta.processing")
                    : !selectedPlan
                      ? t("cta.selectPlan")
                      : paymentMethod === "stripe"
                        ? t("cta.pay", {
                            amount: formatPrice(
                              selectedPlan.priceCents,
                              selectedPlan.currency,
                            ),
                          })
                        : t("cta.continueWithTelegram")}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("payment.secure")}</span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
