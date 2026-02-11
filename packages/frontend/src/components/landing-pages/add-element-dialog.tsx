"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Image,
  Link,
  Share2,
  ShoppingBag,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
} from "lucide-react";
import { LandingPageElementType } from "@/types/landing-page";

interface AddElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: LandingPageElementType) => void;
  existingTypes: LandingPageElementType[];
}

export function AddElementDialog({
  open,
  onOpenChange,
  onSelect,
  existingTypes,
}: AddElementDialogProps) {
  const t = useTranslations("landingPages.addElement");

  const elements = [
    {
      type: LandingPageElementType.IMAGE,
      icon: Image,
      label: t("types.image"),
      description: t("descriptions.image"),
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      type: LandingPageElementType.HEADING_1,
      icon: Heading1,
      label: t("types.heading1"),
      description: t("descriptions.heading1"),
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
    {
      type: LandingPageElementType.HEADING_2,
      icon: Heading2,
      label: t("types.heading2"),
      description: t("descriptions.heading2"),
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
    {
      type: LandingPageElementType.HEADING_3,
      icon: Heading3,
      label: t("types.heading3"),
      description: t("descriptions.heading3"),
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
    {
      type: LandingPageElementType.TEXT,
      icon: AlignLeft,
      label: t("types.text"),
      description: t("descriptions.text"),
      color: "bg-gray-50 text-gray-600 hover:bg-gray-100",
    },
    {
      type: LandingPageElementType.LINK,
      icon: Link,
      label: t("types.link"),
      description: t("descriptions.link"),
      color: "bg-green-50 text-green-600 hover:bg-green-100",
    },
    {
      type: LandingPageElementType.SOCIAL_LINKS,
      icon: Share2,
      label: t("types.socialLinks"),
      description: t("descriptions.socialLinks"),
      color: "bg-pink-50 text-pink-600 hover:bg-pink-100",
      unique: true,
    },
    {
      type: LandingPageElementType.PRODUCTS,
      icon: ShoppingBag,
      label: t("types.products"),
      description: t("descriptions.products"),
      color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
      unique: true,
    },
    {
      type: LandingPageElementType.DIVIDER,
      icon: Minus,
      label: t("types.divider"),
      description: t("descriptions.divider"),
      color: "bg-gray-50 text-gray-600 hover:bg-gray-100",
    },
  ];

  const handleSelect = (type: LandingPageElementType) => {
    onSelect(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="grid gap-2">
            {elements.map((element) => {
              const Icon = element.icon;
              const isDisabled =
                element.unique && existingTypes.includes(element.type);

              return (
                <button
                  key={element.type}
                  onClick={() => handleSelect(element.type)}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed bg-muted"
                      : "hover:border-primary/50 cursor-pointer"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg ${element.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{element.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {element.description}
                    </div>
                  </div>
                  {isDisabled && (
                    <span className="text-xs text-muted-foreground">
                      {t("alreadyAdded")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
