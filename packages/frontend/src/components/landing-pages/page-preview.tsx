"use client";

import { useTranslations } from "next-intl";
import {
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Globe,
  MessageCircle,
} from "lucide-react";
import {
  LandingPageElementType,
  SocialPlatform,
  type LandingPage,
} from "@/types/landing-page";
import { normalizeTextSettings } from "@/lib/landing-pages/text-settings";

interface PagePreviewProps {
  landingPage: LandingPage | null;
  themeColor?: string;
}

export function PagePreview({ landingPage, themeColor }: PagePreviewProps) {
  const t = useTranslations("landingPages.preview");

  if (!landingPage) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">{t("noPreview")}</p>
      </div>
    );
  }

  const color = themeColor || landingPage.themeColor || "#7c3aed";

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

  const renderElement = (element: (typeof landingPage.elements)[0]) => {
    switch (element.type) {
      case LandingPageElementType.IMAGE:
        return element.imageUrl ? (
          <div className="flex justify-center">
            <img
              src={element.imageUrl}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-4"
              style={{ borderColor: color }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect fill='%23f3f4f6' width='96' height='96' rx='48'/%3E%3C/svg%3E";
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-full border-4 bg-muted flex items-center justify-center"
              style={{ borderColor: color }}
            >
              <span className="text-3xl">👤</span>
            </div>
          </div>
        );

      case LandingPageElementType.HEADING_1:
        return (
          <h1
            className="text-2xl font-bold text-center"
            style={{ color }}
          >
            {element.content || t("placeholders.heading1")}
          </h1>
        );

      case LandingPageElementType.HEADING_2:
        return (
          <h2 className="text-xl font-semibold text-center text-foreground">
            {element.content || t("placeholders.heading2")}
          </h2>
        );

      case LandingPageElementType.HEADING_3:
        return (
          <h3 className="text-lg font-medium text-center text-foreground">
            {element.content || t("placeholders.heading3")}
          </h3>
        );

      case LandingPageElementType.TEXT:
        {
          const settings = normalizeTextSettings(element.settings);
          const contentValue = element.content || t("placeholders.text");
          const containerStyle = {
            width: `${settings.width}%`,
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: `${settings.marginTop}px`,
            marginBottom: `${settings.marginBottom}px`,
            textAlign: settings.align,
          } as const;

          const styleMap = {
            TEXT: "text-sm text-muted-foreground",
            H1: "text-2xl font-bold",
            H2: "text-xl font-semibold text-foreground",
            H3: "text-lg font-medium text-foreground",
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
                {contentValue}
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
            className="block w-full p-3 rounded-lg border text-center font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: color,
              color: "white",
            }}
          >
            {element.content || t("placeholders.link")}
          </a>
        );

      case LandingPageElementType.SOCIAL_LINKS:
        if (landingPage.socialLinks.length === 0) {
          return (
            <div className="flex justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Instagram className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Youtube className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          );
        }
        return (
          <div className="flex justify-center gap-3">
            {landingPage.socialLinks.map((link) => {
              const Icon = getSocialIcon(link.platform);
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </a>
              );
            })}
          </div>
        );

      case LandingPageElementType.PRODUCTS:
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("placeholders.productName")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("placeholders.productDescription")}
                  </p>
                </div>
                <div
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: color }}
                >
                  {t("placeholders.productPrice")}
                </div>
              </div>
            </div>
          </div>
        );

      case LandingPageElementType.DIVIDER:
        return <hr className="border-t border-muted" />;

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-muted/30 to-background rounded-lg">
      <div className="max-w-sm mx-auto py-8 px-4 space-y-6">
        {landingPage.elements
          .sort((a, b) => a.order - b.order)
          .map((element) => (
            <div key={element.id}>{renderElement(element)}</div>
          ))}

        {/* Built with Sublynk badge */}
        <div className="pt-8 text-center">
          <span className="text-xs text-muted-foreground">
            Built with{" "}
            <span className="font-semibold" style={{ color }}>
              Sublynk
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
