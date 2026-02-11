"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { billingApi } from "@/lib/api/billing";
import { couponsApi } from "@/lib/api/coupons";
import { affiliatesApi } from "@/lib/api/affiliates";
import type { PublicPlan, PublicProduct } from "@/lib/api/storefront";
import type { ValidateCouponResult } from "@/types/coupon";
import type { ValidateAffiliateResult } from "@/types/affiliate";
import { Check, ShieldCheck, Star, Tag, Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type PlanInterval = PublicPlan["interval"];

type CheckoutPageContentProps = {
  fetchProduct: () => Promise<PublicProduct>;
};

export function CheckoutPageContent({
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

  // Coupon and affiliate
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<ValidateCouponResult | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState("");
  const [affiliateResult, setAffiliateResult] = useState<ValidateAffiliateResult | null>(null);
  const [validatingAffiliate, setValidatingAffiliate] = useState(false);

  const isCheckoutReady = Boolean(
    selectedPlan && telegramUsername && !submitting
  );

  const loadProduct = useCallback(async () => {
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
  }, [fetchProduct, t]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    // Pre-fill from URL params if available
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");
    const telegramParam = searchParams.get("telegram");
    const planParam = searchParams.get("plan");
    const refParam = searchParams.get("ref");
    const couponParam = searchParams.get("coupon");

    if (emailParam) setEmail(emailParam);
    if (nameParam) setDisplayName(nameParam);
    if (telegramParam) setTelegramUsername(telegramParam);
    if (refParam) setAffiliateCode(refParam);
    if (couponParam) setCouponCode(couponParam);

    // Pre-select plan from URL if specified
    if (planParam && product) {
      const plan = product.plans.find((p) => p.id === planParam);
      if (plan) setSelectedPlan(plan);
    }
  }, [searchParams, product]);

  const validateCouponCode = useCallback(async () => {
    if (!couponCode || !selectedPlan || !product) return;

    setValidatingCoupon(true);
    try {
      const result = await couponsApi.validate({
        code: couponCode,
        planId: selectedPlan.id,
        organizationId: product.organization.id,
      });
      setCouponResult(result);
      if (!result.valid) {
        toast.error(result.error || t("coupon.invalid"));
      }
    } catch {
      setCouponResult({ valid: false, error: t("coupon.error") });
    } finally {
      setValidatingCoupon(false);
    }
  }, [couponCode, selectedPlan, product, t]);

  const validateAffiliateCode = useCallback(async () => {
    if (!affiliateCode || !product) return;

    setValidatingAffiliate(true);
    try {
      const result = await affiliatesApi.validate({
        code: affiliateCode,
        organizationId: product.organization.id,
      });
      setAffiliateResult(result);
      if (result.valid) {
        toast.success(t("affiliate.applied"));
      }
    } catch {
      setAffiliateResult({ valid: false, error: t("affiliate.error") });
    } finally {
      setValidatingAffiliate(false);
    }
  }, [affiliateCode, product, t]);

  // Auto-validate affiliate code when pre-filled from URL
  useEffect(() => {
    if (affiliateCode && product && !affiliateResult) {
      validateAffiliateCode();
    }
  }, [affiliateCode, product, affiliateResult, validateAffiliateCode]);

  // Auto-validate coupon when pre-filled from URL and plan is selected
  useEffect(() => {
    if (couponCode && selectedPlan && product && !couponResult) {
      validateCouponCode();
    }
  }, [couponCode, selectedPlan, product, couponResult, validateCouponCode]);

  function clearCoupon() {
    setCouponCode("");
    setCouponResult(null);
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
          couponCode: couponResult?.valid ? couponCode : undefined,
          affiliateCode: affiliateResult?.valid ? affiliateCode : undefined,
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
                  className="inline-flex items-center gap-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium"
                >
                  {channel.provider === "TELEGRAM"
                    ? "📱"
                    : channel.provider === "DISCORD"
                      ? "💬"
                      : "🟢"}
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
                          ? "bg-purple-50 shadow-lg border-purple-600 ring-2 ring-purple-600/80"
                          : "hover:shadow-md hover:border-purple-600"
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                    {index === 0 && product.plans.length > 1 && (
                      <div
                        className="absolute -top-3 left-4 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium"
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
                            <Check className="h-5 w-5 text-purple-600" />
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
                    className="focus-visible:border-purple-600 focus-visible:ring-purple-600/30 focus-visible:ring-offset-0"
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
                    className="focus-visible:border-purple-600 focus-visible:ring-purple-600/30 focus-visible:ring-offset-0"
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
                    className="focus-visible:border-purple-600 focus-visible:ring-purple-600/30 focus-visible:ring-offset-0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("form.emailHelp")}
                  </p>
                </div>

                {/* Coupon code */}
                <div className="border-t pt-4">
                  <Label htmlFor="coupon">{t("coupon.label")}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponResult(null);
                      }}
                      placeholder={t("coupon.placeholder")}
                      className="uppercase focus-visible:border-purple-600 focus-visible:ring-purple-600/30 focus-visible:ring-offset-0"
                      disabled={!selectedPlan}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateCouponCode}
                      disabled={!couponCode || !selectedPlan || validatingCoupon}
                      className="shrink-0"
                    >
                      {validatingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("coupon.apply")
                      )}
                    </Button>
                  </div>
                  {couponResult && (
                    <div
                      className={`mt-2 flex items-center gap-2 text-sm ${
                        couponResult.valid ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {couponResult.valid ? (
                        <>
                          <Tag className="h-4 w-4" />
                          <span>
                            {couponResult.discountPercentage
                              ? t("coupon.discountPercent", {
                                  percent: couponResult.discountPercentage,
                                })
                              : t("coupon.discountAmount", {
                                  amount: formatPrice(
                                    couponResult.discountCents || 0,
                                    selectedPlan?.currency || "EUR"
                                  ),
                                })}
                          </span>
                          <button
                            type="button"
                            onClick={clearCoupon}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span>{couponResult.error}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Affiliate code (hidden if pre-filled and valid) */}
                {!affiliateResult?.valid && (
                  <div>
                    <Label htmlFor="affiliate">{t("affiliate.label")}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="affiliate"
                        value={affiliateCode}
                        onChange={(e) => {
                          setAffiliateCode(e.target.value.toUpperCase());
                          setAffiliateResult(null);
                        }}
                        placeholder={t("affiliate.placeholder")}
                        className="uppercase focus-visible:border-purple-600 focus-visible:ring-purple-600/30 focus-visible:ring-offset-0"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={validateAffiliateCode}
                        disabled={!affiliateCode || validatingAffiliate}
                        className="shrink-0"
                      >
                        {validatingAffiliate ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("affiliate.apply")
                        )}
                      </Button>
                    </div>
                    {affiliateResult && !affiliateResult.valid && (
                      <p className="mt-1 text-sm text-red-600">
                        {affiliateResult.error}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-3 block">
                    {t("payment.title")}
                  </Label>
                  <div className="space-y-2">
                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        paymentMethod === "stripe"
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-purple-600"
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
                          className="h-4 w-4 accent-purple-600"
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
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-purple-600"
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
                          className="h-4 w-4 accent-purple-600"
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
                      <div className="text-right">
                        {couponResult?.valid && couponResult.discountCents ? (
                          <>
                            <span className="line-through text-slate-400 mr-2">
                              {formatPrice(
                                selectedPlan.priceCents,
                                selectedPlan.currency,
                              )}
                            </span>
                            <span className="font-semibold text-green-600">
                              {formatPrice(
                                selectedPlan.priceCents - couponResult.discountCents,
                                selectedPlan.currency,
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            {formatPrice(
                              selectedPlan.priceCents,
                              selectedPlan.currency,
                            )}
                          </span>
                        )}
                        <span className="ml-1 text-xs text-slate-500">
                          {intervalLabels[selectedPlan.interval]}
                        </span>
                      </div>
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
                  className={`w-full h-12 text-base font-semibold transition-colors disabled:opacity-100 ${
                    isCheckoutReady
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                  size="lg"
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
