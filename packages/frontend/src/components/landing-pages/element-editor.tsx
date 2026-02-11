/* eslint-disable @next/next/no-img-element */
"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LandingPageElementType,
  type LandingPageElement,
  type UpdateElementDto,
} from "@/types/landing-page";
import {
  normalizeTextSettings,
  type TextElementAlign,
  type TextElementStyle,
} from "@/lib/landing-pages/text-settings";

interface ElementEditorProps {
  element: LandingPageElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, dto: UpdateElementDto) => Promise<void> | void;
  onReorder?: (elementId: string, newIndex: number) => Promise<void> | void;
  totalElements?: number;
}

export function ElementEditor({
  element,
  open,
  onOpenChange,
  onSave,
  onReorder,
  totalElements,
}: ElementEditorProps) {
  const t = useTranslations("landingPages.elementEditor");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [textStyle, setTextStyle] = useState<TextElementStyle>("TEXT");
  const [textAlign, setTextAlign] = useState<TextElementAlign>("center");
  const [textWidth, setTextWidth] = useState(100);
  const [textMarginTop, setTextMarginTop] = useState(0);
  const [textMarginBottom, setTextMarginBottom] = useState(0);
  const [textPosition, setTextPosition] = useState(1);

  useEffect(() => {
    if (element) {
      setContent(element.content || "");
      setImageUrl(element.imageUrl || "");
      setLinkUrl(element.linkUrl || "");
      if (element.type === LandingPageElementType.TEXT) {
        const settings = normalizeTextSettings(element.settings);
        setTextStyle(settings.style);
        setTextAlign(settings.align);
        setTextWidth(settings.width);
        setTextMarginTop(settings.marginTop);
        setTextMarginBottom(settings.marginBottom);
        setTextPosition(element.order + 1);
      }
    }
  }, [element]);

  const handleSave = async () => {
    if (!element) return;

    const dto: UpdateElementDto = {};
    let shouldReorder = false;

    switch (element.type) {
      case LandingPageElementType.IMAGE:
        dto.imageUrl = imageUrl || null;
        break;
      case LandingPageElementType.HEADING_1:
      case LandingPageElementType.HEADING_2:
      case LandingPageElementType.HEADING_3:
      case LandingPageElementType.TEXT:
        dto.content = content || null;
        if (element.type === LandingPageElementType.TEXT) {
          dto.settings = {
            style: textStyle,
            align: textAlign,
            width: textWidth,
            marginTop: textMarginTop,
            marginBottom: textMarginBottom,
          };
          if (textPosition - 1 !== element.order) {
            shouldReorder = true;
          }
        }
        break;
      case LandingPageElementType.LINK:
        dto.content = content || null;
        dto.linkUrl = linkUrl || null;
        break;
      default:
        break;
    }

    await onSave(element.id, dto);
    if (
      shouldReorder &&
      onReorder &&
      typeof totalElements === "number" &&
      totalElements > 1
    ) {
      const newIndex = Math.min(
        Math.max(0, textPosition - 1),
        totalElements - 1
      );
      await onReorder(element.id, newIndex);
    }
    onOpenChange(false);
  };

  if (!element) return null;

  const renderEditor = () => {
    switch (element.type) {
      case LandingPageElementType.IMAGE:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">{t("imageUrl")}</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t("imageUrlPlaceholder")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("imageUrlHelp")}
              </p>
            </div>
            {imageUrl && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  {t("preview")}
                </p>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full max-h-32 rounded-lg object-contain mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        );

      case LandingPageElementType.HEADING_1:
        return (
          <div>
            <Label htmlFor="content">{t("heading1Content")}</Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("heading1Placeholder")}
              className="text-xl font-bold"
            />
          </div>
        );

      case LandingPageElementType.HEADING_2:
        return (
          <div>
            <Label htmlFor="content">{t("heading2Content")}</Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("heading2Placeholder")}
              className="text-lg font-semibold"
            />
          </div>
        );

      case LandingPageElementType.HEADING_3:
        return (
          <div>
            <Label htmlFor="content">{t("heading3Content")}</Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("heading3Placeholder")}
              className="font-medium"
            />
          </div>
        );

      case LandingPageElementType.TEXT:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">{t("textContent")}</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("textPlaceholder")}
                className="w-full min-h-[120px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <Label>{t("textStyle")}</Label>
              <div className="flex items-center gap-2 mt-2">
                {[
                  { value: "TEXT", label: t("textStyleText") },
                  { value: "H1", label: t("textStyleH1") },
                  { value: "H2", label: t("textStyleH2") },
                  { value: "H3", label: t("textStyleH3") },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={textStyle === option.value ? "default" : "outline"}
                    onClick={() =>
                      setTextStyle(option.value as TextElementStyle)
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t("textAlignment")}</Label>
              <div className="flex items-center gap-2 mt-2">
                {[
                  { value: "left", label: t("textAlignLeft") },
                  { value: "center", label: t("textAlignCenter") },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={textAlign === option.value ? "default" : "outline"}
                    onClick={() =>
                      setTextAlign(option.value as TextElementAlign)
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t("textWidth")}</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={textWidth}
                  onChange={(e) => setTextWidth(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {textWidth}%
                </span>
              </div>
            </div>

            <div>
              <Label>{t("textMargins")}</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-10">
                    {t("textMarginTop")}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={48}
                    step={2}
                    value={textMarginTop}
                    onChange={(e) => setTextMarginTop(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {textMarginTop}px
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-10">
                    {t("textMarginBottom")}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={48}
                    step={2}
                    value={textMarginBottom}
                    onChange={(e) => setTextMarginBottom(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {textMarginBottom}px
                  </span>
                </div>
              </div>
            </div>

            {typeof totalElements === "number" && totalElements > 1 && (
              <div>
                <Label>{t("textPosition")}</Label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min={1}
                    max={totalElements}
                    step={1}
                    value={textPosition}
                    onChange={(e) => setTextPosition(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {textPosition}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case LandingPageElementType.LINK:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">{t("linkText")}</Label>
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("linkTextPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="linkUrl">{t("linkUrl")}</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={t("linkUrlPlaceholder")}
              />
            </div>
          </div>
        );

      case LandingPageElementType.PRODUCTS:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("productsInfo")}</p>
          </div>
        );

      case LandingPageElementType.SOCIAL_LINKS:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("socialLinksInfo")}</p>
          </div>
        );

      case LandingPageElementType.DIVIDER:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("dividerInfo")}</p>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    const titles: Record<LandingPageElementType, string> = {
      [LandingPageElementType.IMAGE]: t("titles.image"),
      [LandingPageElementType.HEADING_1]: t("titles.heading1"),
      [LandingPageElementType.HEADING_2]: t("titles.heading2"),
      [LandingPageElementType.HEADING_3]: t("titles.heading3"),
      [LandingPageElementType.TEXT]: t("titles.text"),
      [LandingPageElementType.LINK]: t("titles.link"),
      [LandingPageElementType.PRODUCTS]: t("titles.products"),
      [LandingPageElementType.SOCIAL_LINKS]: t("titles.socialLinks"),
      [LandingPageElementType.DIVIDER]: t("titles.divider"),
    };
    return titles[element.type];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{renderEditor()}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>{t("save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
