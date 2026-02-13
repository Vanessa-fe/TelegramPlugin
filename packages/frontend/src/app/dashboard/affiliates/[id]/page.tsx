"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { affiliatesApi } from "@/lib/api/affiliates";
import { organizationsApi } from "@/lib/api/organizations";
import { plansApi } from "@/lib/api/plans";
import { productsApi } from "@/lib/api/products";
import { getAffiliateDisplayLabel, getVisibleAffiliateEmail } from "@/lib/affiliate-utils";
import { slugify } from "@/lib/slugify";
import type { Plan } from "@/types/plan";
import type { Product } from "@/types/product";
import type {
  Affiliate,
  AffiliateReferral,
  AffiliateStatus,
} from "@/types/affiliate";
import {
  ArrowLeft,
  Edit,
  Ban,
  Users,
  TrendingUp,
  Clock,
  Coins,
  Link2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const statusClassNames: Record<AffiliateStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  DEACTIVATED: "bg-gray-100 text-gray-500",
};

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("affiliates");

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isShareLinkLoading, setIsShareLinkLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const statusLabels: Record<AffiliateStatus, string> = {
    PENDING: t("statusLabels.PENDING"),
    ACTIVE: t("statusLabels.ACTIVE"),
    SUSPENDED: t("statusLabels.SUSPENDED"),
    DEACTIVATED: t("statusLabels.DEACTIVATED"),
  };

  const loadShareLinkContext = useCallback(
    async (organizationId: string) => {
      setIsShareLinkLoading(true);

      try {
        const [organizationData, productsData, plansData] = await Promise.all([
          organizationsApi.findOne(organizationId),
          productsApi.findAll(organizationId),
          plansApi.findAll({ organizationId }),
        ]);
        const activeProducts = productsData.filter(
          (product) => product.status === "ACTIVE"
        );
        const activePlans = plansData.filter((plan) => plan.isActive);

        setOrganizationSlug(organizationData.slug);
        setProducts(activeProducts);
        setPlans(activePlans);
        setSelectedProductId((currentSelectedProductId) => {
          if (
            currentSelectedProductId &&
            activeProducts.some((product) => product.id === currentSelectedProductId)
          ) {
            return currentSelectedProductId;
          }
          return activeProducts[0]?.id ?? "";
        });
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(
          axiosError.response?.data?.message || t("toast.shareLinkLoadError")
        );
      } finally {
        setIsShareLinkLoading(false);
      }
    },
    [t]
  );

  const loadAffiliate = useCallback(async () => {
    try {
      const id = params.id as string;
      const [affiliateData, referralsData] = await Promise.all([
        affiliatesApi.findOne(id),
        affiliatesApi.getReferrals(id),
      ]);
      setAffiliate(affiliateData);
      setReferrals(referralsData);
      await loadShareLinkContext(affiliateData.organizationId);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.loadError"));
      router.push("/dashboard/affiliates");
    } finally {
      setIsLoading(false);
    }
  }, [loadShareLinkContext, params.id, router, t]);

  useEffect(() => {
    loadAffiliate();
  }, [loadAffiliate]);

  async function handleDeactivate() {
    if (!affiliate) return;
    try {
      await affiliatesApi.deactivate(affiliate.id);
      toast.success(t("toast.deactivateSuccess"));
      loadAffiliate();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toast.deactivateError"));
    }
  }

  function formatCurrency(cents: number, currency: string = "EUR") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  const activeProductPlans = useMemo(() => {
    if (!selectedProductId) return [];

    return plans
      .filter((plan) => plan.productId === selectedProductId && plan.isActive)
      .sort((firstPlan, secondPlan) => firstPlan.priceCents - secondPlan.priceCents);
  }, [plans, selectedProductId]);

  const selectedPlan = useMemo(() => {
    return activeProductPlans[0] ?? null;
  }, [activeProductPlans]);

  const affiliateShareLink = useMemo(() => {
    if (!affiliate || !selectedProduct) return "";

    const baseUrl = (() => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const productSlug = slugify(selectedProduct.name);
      if (organizationSlug && productSlug) {
        return `${origin}/checkout/${organizationSlug}/${productSlug}`;
      }
      return `${origin}/checkout/${selectedProduct.id}`;
    })();

    const params = new URLSearchParams();
    params.set("ref", affiliate.referralCode);
    if (selectedPlan && activeProductPlans.length > 1) {
      params.set("plan", selectedPlan.id);
    }

    return `${baseUrl}?${params.toString()}`;
  }, [activeProductPlans.length, affiliate, organizationSlug, selectedPlan, selectedProduct]);

  async function handleCopyShareLink() {
    if (!affiliateShareLink) return;
    try {
      await navigator.clipboard.writeText(affiliateShareLink);
      toast.success(t("detail.shareLink.copied"));
    } catch {
      toast.error(t("detail.shareLink.copyError"));
    }
  }

  const affiliateDisplayLabel = affiliate
    ? getAffiliateDisplayLabel(affiliate)
    : "";
  const visibleAffiliateEmail = affiliate
    ? getVisibleAffiliateEmail(affiliate.email)
    : null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!affiliate) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/affiliates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("detail.back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center gap-3">
              {affiliateDisplayLabel}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassNames[affiliate.status]}`}
              >
                {statusLabels[affiliate.status]}
              </span>
            </h1>
            {affiliate.name && visibleAffiliateEmail && (
              <p className="text-text-secondary">{visibleAffiliateEmail}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/affiliates/${affiliate.id}/payouts`}>
            <Button variant="outline">
              <Coins className="h-4 w-4 mr-2" />
              {t("detail.payouts")}
            </Button>
          </Link>
          <Link href={`/dashboard/affiliates/${affiliate.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {t("detail.edit")}
            </Button>
          </Link>
          {affiliate.status !== "DEACTIVATED" && (
            <Button variant="destructive" onClick={handleDeactivate}>
              <Ban className="h-4 w-4 mr-2" />
              {t("detail.deactivate")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("detail.stats.referrals")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{referrals.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("detail.stats.commission")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{affiliate.commissionRate}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Coins className="h-4 w-4" />
              {t("detail.stats.totalEarnings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(affiliate.totalEarnings)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("detail.stats.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-orange-600">
              {formatCurrency(affiliate.pendingEarnings)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.referralCode.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
              {affiliate.referralCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(affiliate.referralCode);
                toast.success(t("detail.referralCode.copied"));
              }}
            >
              {t("detail.referralCode.copy")}
            </Button>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            {t("detail.referralCode.help")}
          </p>
        </CardContent>
      </Card>

      {/* Share Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t("detail.shareLink.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isShareLinkLoading ? (
            <p className="text-sm text-text-secondary">
              {t("detail.shareLink.loading")}
            </p>
          ) : products.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                {t("detail.shareLink.noProducts")}
              </p>
              <Link href="/dashboard/products/new">
                <Button variant="outline" size="sm">
                  {t("detail.shareLink.createProduct")}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="affiliate-product-selector"
                  className="text-sm font-medium text-text-secondary"
                >
                  {t("detail.shareLink.productLabel")}
                </label>
                <select
                  id="affiliate-product-selector"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Input value={affiliateShareLink} readOnly />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShareLink}
                    disabled={!affiliateShareLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t("detail.shareLink.copy")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(affiliateShareLink, "_blank")}
                    disabled={!affiliateShareLink}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("detail.shareLink.open")}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-text-secondary">
                {t("detail.shareLink.help")}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.referrals.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-center text-text-secondary py-8">
              {t("detail.referrals.empty")}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-custom">
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.customer")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.plan")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.amount")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.commission")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.status")}
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary px-4 py-3">
                    {t("detail.referrals.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-border-custom last:border-0"
                  >
                    <td className="px-4 py-3 text-sm">
                      {referral.customer?.telegramUsername ||
                        referral.customer?.email ||
                        "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {referral.subscription?.plan?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(referral.amountCents, referral.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      {formatCurrency(referral.commissionCents, referral.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          referral.isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {referral.isPaid
                          ? t("detail.referrals.paid")
                          : t("detail.referrals.pending")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(referral.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
