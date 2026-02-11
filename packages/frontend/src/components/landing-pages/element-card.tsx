"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit2,
  GripVertical,
  Image,
  Type,
  Link,
  Share2,
  ShoppingBag,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LandingPageElementType,
  type LandingPageElement,
} from "@/types/landing-page";

interface ElementCardProps {
  element: LandingPageElement;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ElementCard({
  element,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: ElementCardProps) {
  const t = useTranslations("landingPages.elements");

  const elementConfig = useMemo(() => {
    const configs: Record<
      LandingPageElementType,
      { icon: typeof Image; label: string; color: string }
    > = {
      [LandingPageElementType.IMAGE]: {
        icon: Image,
        label: t("types.image"),
        color: "bg-blue-50 text-blue-600",
      },
      [LandingPageElementType.HEADING_1]: {
        icon: Type,
        label: t("types.heading1"),
        color: "bg-purple-50 text-purple-600",
      },
      [LandingPageElementType.HEADING_2]: {
        icon: Type,
        label: t("types.heading2"),
        color: "bg-purple-50 text-purple-600",
      },
      [LandingPageElementType.HEADING_3]: {
        icon: Type,
        label: t("types.heading3"),
        color: "bg-purple-50 text-purple-600",
      },
      [LandingPageElementType.TEXT]: {
        icon: Type,
        label: t("types.text"),
        color: "bg-gray-50 text-gray-600",
      },
      [LandingPageElementType.LINK]: {
        icon: Link,
        label: t("types.link"),
        color: "bg-green-50 text-green-600",
      },
      [LandingPageElementType.SOCIAL_LINKS]: {
        icon: Share2,
        label: t("types.socialLinks"),
        color: "bg-pink-50 text-pink-600",
      },
      [LandingPageElementType.PRODUCTS]: {
        icon: ShoppingBag,
        label: t("types.products"),
        color: "bg-amber-50 text-amber-600",
      },
      [LandingPageElementType.DIVIDER]: {
        icon: Minus,
        label: t("types.divider"),
        color: "bg-gray-50 text-gray-600",
      },
    };
    return configs[element.type];
  }, [element.type, t]);

  const Icon = elementConfig.icon;

  const getPreviewContent = () => {
    switch (element.type) {
      case LandingPageElementType.IMAGE:
        return element.imageUrl ? (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {element.imageUrl}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            {t("noImage")}
          </span>
        );
      case LandingPageElementType.HEADING_1:
      case LandingPageElementType.HEADING_2:
      case LandingPageElementType.HEADING_3:
      case LandingPageElementType.TEXT:
        return element.content ? (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {element.content}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            {t("noContent")}
          </span>
        );
      case LandingPageElementType.LINK:
        return element.content ? (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {element.content}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            {t("noLink")}
          </span>
        );
      case LandingPageElementType.PRODUCTS:
        return (
          <span className="text-sm text-muted-foreground">
            {t("productsAuto")}
          </span>
        );
      case LandingPageElementType.SOCIAL_LINKS:
        return (
          <span className="text-sm text-muted-foreground">
            {t("socialLinksAuto")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border hover:border-primary/50 transition-colors group">
      <div className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      <div
        className={`flex items-center justify-center w-8 h-8 rounded ${elementConfig.color}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{elementConfig.label}</div>
        {getPreviewContent()}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
