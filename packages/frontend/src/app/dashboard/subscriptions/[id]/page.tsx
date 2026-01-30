"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { plansApi } from "@/lib/api/plans";
import { productsApi } from "@/lib/api/products";
import type { Plan } from "@/types/plan";
import type { Product } from "@/types/product";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  Copy,
  ExternalLink,
  Instagram,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  QrCode,
  Send,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PromotePage() {
  const t = useTranslations("promote");
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const intervalLabels: Record<string, string> = useMemo(
    () => ({
      ONE_TIME: t("interval.ONE_TIME"),
      DAY: t("interval.DAY"),
      WEEK: t("interval.WEEK"),
      MONTH: t("interval.MONTH"),
      QUARTER: t("interval.QUARTER"),
      YEAR: t("interval.YEAR"),
    }),
    [t]
  );

  function formatPrice(cents: number, currency: string): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const [productsData, plansData] = await Promise.all([
        productsApi.findAll(),
        plansApi.findAll(),
      ]);

      // Only show active products
      const activeProducts = productsData.filter((p) => p.status === "ACTIVE");
      setProducts(activeProducts);
      setPlans(plansData);

      // Select first product by default
      if (activeProducts.length > 0) setSelectedProductId(activeProducts[0].id);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("errors.loadOffers"));
    } finally {
      setIsLoading(false);
    }
  }

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const productPlans = useMemo(() => {
    return plans.filter((p) => p.productId === selectedProductId && p.isActive);
  }, [plans, selectedProductId]);

  // Generate payment link (placeholder - would be replaced with actual Stripe link)
  const paymentLink = useMemo(() => {
    if (!selectedProduct) return "";
    const slug = slugify(selectedProduct.name);
    return `${window.location.origin}/pay/${slug}`;
  }, [selectedProduct]);

  // Generate share message
  const shareMessage = useMemo(() => {
    if (!selectedProduct || productPlans.length === 0) return "";
    const plan = productPlans[0];

    const price = formatPrice(plan.priceCents, plan.currency);
    const interval = intervalLabels[plan.interval] || "";
    const formattedPrice =
      plan.interval === "ONE_TIME" ? price : `${price} ${interval}`.trim();

    return t("shareMessage.template", {
      productName: selectedProduct.name,
      price: formattedPrice,
      link: paymentLink,
    });
  }, [
    selectedProduct,
    productPlans,
    paymentLink,
    formatPrice,
    intervalLabels,
    t,
  ]);

  async function copyToClipboard(text: string, type: "link" | "message") {
    try {
      await navigator.clipboard.writeText(text);

      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      }

      toast.success(t("toasts.copied"));
    } catch {
      toast.error(t("toasts.copyError"));
    }
  }

  function shareOnPlatform(platform: "telegram" | "twitter" | "email") {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(paymentLink);

    const urls: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      email: `mailto:?subject=${encodeURIComponent(
        t("email.subject", {
          productName: selectedProduct?.name || t("email.defaultOffer"),
        })
      )}&body=${encodedMessage}`,
    };

    if (urls[platform]) window.open(urls[platform], "_blank");
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Empty state - no products
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">{t("empty.title")}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {t("empty.description")}
          </p>

          <Button className="mt-6" asChild>
            <a href="/dashboard/products/new">{t("empty.cta")}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Product selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">{t("selectProduct")}</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Link Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" />
              {t("salesLink.title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
              <input
                type="text"
                readOnly
                value={paymentLink}
                className="flex-1 bg-transparent text-sm font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(paymentLink, "link")}
              >
                {copiedLink ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copiedLink ? t("salesLink.copied") : t("salesLink.copy")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(paymentLink, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {t("salesLink.open")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(t("salesLink.qrCodeSoon"))}
              >
                <QrCode className="h-4 w-4 mr-1" />
                {t("salesLink.qrCode")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Message Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              {t("shareMessage.title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <textarea
                readOnly
                value={shareMessage}
                rows={8}
                className="w-full bg-transparent text-sm resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(shareMessage, "message")}
              >
                {copiedMessage ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copiedMessage ? t("salesLink.copied") : t("salesLink.copy")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("shareDirect.title")}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => shareOnPlatform("telegram")}
            >
              <Send className="h-4 w-4 mr-2" />
              {t("shareDirect.telegram")}
            </Button>

            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => toast.info(t("shareDirect.instagramHint"))}
            >
              <Instagram className="h-4 w-4 mr-2" />
              {t("shareDirect.instagram")}
            </Button>

            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => shareOnPlatform("twitter")}
            >
              <Twitter className="h-4 w-4 mr-2" />
              {t("shareDirect.twitter")}
            </Button>

            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => shareOnPlatform("email")}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t("shareDirect.email")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Info */}
      {productPlans.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("offerDetails.title")}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {productPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      {formatPrice(plan.priceCents, plan.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {intervalLabels[plan.interval] || ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
