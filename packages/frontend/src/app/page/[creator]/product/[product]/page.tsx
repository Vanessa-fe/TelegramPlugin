/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { storefrontApi } from "@/lib/api/storefront";
import { getLocale, getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ creator: string; product: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("publicPages");
  const { creator, product: productSlug } = await params;

  try {
    const data = await storefrontApi.getProductBySlug(creator, productSlug);
    const seoDescription =
      data.description ||
      t("seo.productDescription", {
        productName: data.name,
        organizationName: data.organization.name,
      });

    return {
      title: `${data.name} - ${data.organization.name}`,
      description: seoDescription,
      openGraph: {
        title: `${data.name} - ${data.organization.name}`,
        description: seoDescription,
        type: "website",
      },
    };
  } catch {
    return {
      title: t("seo.productNotFoundTitle"),
    };
  }
}

export default async function ProductPage({ params }: Props) {
  const { creator, product: productSlug } = await params;
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("publicPages"),
  ]);

  let data;
  try {
    data = await storefrontApi.getProductBySlug(creator, productSlug);
  } catch {
    notFound();
  }

  const color = "#7c3aed"; // Default theme color
  const logoUrl = data.organization.branding?.logoUrl?.trim() || null;
  const hideSublynkBranding =
    data.organization.branding?.hideSublynkBranding === true;
  const intervalLabels: Record<string, string> = {
    ONE_TIME: t("interval.ONE_TIME"),
    DAY: t("interval.DAY"),
    WEEK: t("interval.WEEK"),
    MONTH: t("interval.MONTH"),
    QUARTER: t("interval.QUARTER"),
    YEAR: t("interval.YEAR"),
  };

  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(priceCents / 100);
  };

  const formatInterval = (interval: string) => intervalLabels[interval] || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-lg mx-auto py-8 px-5">
        {/* Back link */}
        <Link
          href={`/page/${creator}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backTo", { name: data.organization.name })}
        </Link>

        {logoUrl ? (
          <div className="mb-6">
            <img
              src={logoUrl}
              alt={t("logoAlt", { name: data.organization.name })}
              className="h-14 w-14 rounded-lg object-cover shadow-sm"
            />
          </div>
        ) : null}

        {/* Product header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.name}</h1>
          {data.description && (
            <p className="text-gray-600 leading-relaxed">{data.description}</p>
          )}
        </div>

        {/* Channels included */}
        {data.channels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              {t("includedAccess")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.channels.map((channel) => (
                <span
                  key={channel.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  {channel.title || t("channelFallback")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            {t("chooseOffer")}
          </h2>
          {data.plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/checkout/${data.id}?plan=${plan.id}`}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all bg-white shadow-sm hover:shadow-md group"
            >
              <div className="flex-1">
                <p className="font-semibold text-lg text-gray-800 group-hover:text-gray-900">
                  {plan.name}
                </p>
                {plan.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.description}
                  </p>
                )}
                {plan.trialPeriodDays && plan.trialPeriodDays > 0 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    {t("trialDays", { count: plan.trialPeriodDays })}
                  </p>
                )}
              </div>
              <div
                className="px-5 py-3 rounded-xl text-white font-bold text-lg transition-transform group-hover:scale-105"
                style={{ backgroundColor: color }}
              >
                {formatPrice(plan.priceCents, plan.currency)}
                <span className="text-sm font-normal opacity-80 ml-1">
                  {formatInterval(plan.interval)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!hideSublynkBranding ? (
          <div className="mt-16 pt-8 text-center border-t border-gray-100">
            <a
              href="https://sublynk.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t("builtWith")}{" "}
              <span className="font-semibold" style={{ color }}>
                Sublynk
              </span>
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
