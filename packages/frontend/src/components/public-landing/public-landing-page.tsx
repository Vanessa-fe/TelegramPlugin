/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Globe,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import {
  LandingPageElementType,
  SocialPlatform,
  type PublicLandingPage,
} from "@/types/landing-page";
import { normalizeTextSettings } from "@/lib/landing-pages/text-settings";

interface PublicLandingPageProps {
  data: PublicLandingPage;
}

export function PublicLandingPage({ data }: PublicLandingPageProps) {
  const { organization, landingPage, products } = data;
  const color = landingPage.themeColor || "#7c3aed";

  const getSocialIcon = (platform: SocialPlatform) => {
    const icons: Record<SocialPlatform, typeof Instagram> = {
      [SocialPlatform.INSTAGRAM]: Instagram,
      [SocialPlatform.YOUTUBE]: Youtube,
      [SocialPlatform.TWITTER]: Twitter,
      [SocialPlatform.LINKEDIN]: Linkedin,
      [SocialPlatform.TELEGRAM]: MessageCircle,
      [SocialPlatform.DISCORD]: MessageCircle,
      [SocialPlatform.TIKTOK]: MessageCircle,
      [SocialPlatform.WEBSITE]: Globe,
    };
    return icons[platform] || Globe;
  };

  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(priceCents / 100);
  };

  const formatInterval = (interval: string) => {
    const intervals: Record<string, string> = {
      ONE_TIME: "une fois",
      DAY: "/jour",
      WEEK: "/semaine",
      MONTH: "/mois",
      QUARTER: "/trimestre",
      YEAR: "/an",
    };
    return intervals[interval] || "";
  };

  const renderElement = (element: (typeof landingPage.elements)[0]) => {
    switch (element.type) {
      case LandingPageElementType.IMAGE:
        return element.imageUrl ? (
          <div className="flex justify-center">
            <img
              src={element.imageUrl}
              alt={organization.name}
              className="w-28 h-28 rounded-full object-cover border-4 shadow-lg"
              style={{ borderColor: color }}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="w-28 h-28 rounded-full border-4 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg"
              style={{ borderColor: color }}
            >
              <span className="text-4xl">👤</span>
            </div>
          </div>
        );

      case LandingPageElementType.HEADING_1:
        return (
          <h1
            className="text-3xl font-bold text-center"
            style={{ color }}
          >
            {element.content || organization.name}
          </h1>
        );

      case LandingPageElementType.HEADING_2:
        return (
          <h2 className="text-2xl font-semibold text-center text-gray-800">
            {element.content}
          </h2>
        );

      case LandingPageElementType.HEADING_3:
        return (
          <h3 className="text-xl font-medium text-center text-gray-700">
            {element.content}
          </h3>
        );

      case LandingPageElementType.TEXT:
        {
          const settings = normalizeTextSettings(element.settings);
          const containerStyle = {
            width: `${settings.width}%`,
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: `${settings.marginTop}px`,
            marginBottom: `${settings.marginBottom}px`,
            textAlign: settings.align,
          } as const;

          const styleMap = {
            TEXT: "text-base text-gray-600 leading-relaxed",
            H1: "text-3xl font-bold",
            H2: "text-2xl font-semibold text-gray-800",
            H3: "text-xl font-medium text-gray-700",
          } as const;

          const Tag =
            settings.style === "TEXT"
              ? "p"
              : (settings.style.toLowerCase() as "h1" | "h2" | "h3");

          return (
            <div style={containerStyle}>
              <Tag
                className={styleMap[settings.style]}
                style={settings.style === "H1" ? { color } : undefined}
              >
                {element.content}
              </Tag>
            </div>
          );
        }

      case LandingPageElementType.LINK:
        return (
          <a
            href={element.linkUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] shadow-md"
            style={{ backgroundColor: color }}
          >
            {element.content}
            <ExternalLink className="w-4 h-4" />
          </a>
        );

      case LandingPageElementType.SOCIAL_LINKS:
        if (landingPage.socialLinks.length === 0) {
          return null;
        }
        return (
          <div className="flex justify-center gap-4">
            {landingPage.socialLinks
              .sort((a, b) => a.order - b.order)
              .map((link) => {
                const Icon = getSocialIcon(link.platform);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80 hover:scale-110 shadow-md"
                    style={{ backgroundColor: color }}
                    title={link.platform}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                );
              })}
          </div>
        );

      case LandingPageElementType.PRODUCTS:
        if (products.length === 0) {
          return null;
        }
        return (
          <div className="space-y-4 w-full">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <h4 className="font-semibold text-lg text-gray-800">
                    {product.name}
                  </h4>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {product.description}
                    </p>
                  )}
                </div>

                {product.channels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.channels.map((channel) => (
                      <span
                        key={channel.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {channel.title || "Channel"}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {product.plans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/checkout/${product.id}?plan=${plan.id}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-gray-800 group-hover:text-gray-900">
                          {plan.name}
                        </p>
                        {plan.description && (
                          <p className="text-xs text-gray-500">
                            {plan.description}
                          </p>
                        )}
                        {plan.trialPeriodDays && plan.trialPeriodDays > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            {plan.trialPeriodDays} jours d&apos;essai gratuit
                          </p>
                        )}
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg text-white font-semibold text-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: color }}
                      >
                        {formatPrice(plan.priceCents, plan.currency)}
                        <span className="text-xs font-normal opacity-80">
                          {formatInterval(plan.interval)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case LandingPageElementType.DIVIDER:
        return (
          <div className="w-full flex items-center gap-4">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: `${color}30` }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-lg mx-auto py-12 px-5">
        <div className="space-y-8">
          {landingPage.elements
            .sort((a, b) => a.order - b.order)
            .map((element) => (
              <div key={element.id}>{renderElement(element)}</div>
            ))}
        </div>

        {/* Built with Sublynk badge */}
        <div className="mt-16 pt-8 text-center border-t border-gray-100">
          <a
            href="https://sublynk.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Built with{" "}
            <span className="font-semibold" style={{ color }}>
              Sublynk
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
