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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { SocialPlatform, type SocialLink, type SocialLinkDto } from "@/types/landing-page";

interface SocialLinksEditorProps {
  socialLinks: SocialLink[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (links: SocialLinkDto[]) => void;
}

export function SocialLinksEditor({
  socialLinks,
  open,
  onOpenChange,
  onSave,
}: SocialLinksEditorProps) {
  const t = useTranslations("landingPages.socialLinksEditor");
  const [links, setLinks] = useState<SocialLinkDto[]>([]);

  useEffect(() => {
    if (socialLinks.length > 0) {
      setLinks(
        socialLinks.map((l) => ({
          platform: l.platform,
          url: l.url,
          order: l.order,
        }))
      );
    } else {
      setLinks([]);
    }
  }, [socialLinks]);

  const platformOptions = [
    { value: SocialPlatform.INSTAGRAM, label: "Instagram", icon: "📸" },
    { value: SocialPlatform.YOUTUBE, label: "YouTube", icon: "📺" },
    { value: SocialPlatform.TWITTER, label: "X (Twitter)", icon: "🐦" },
    { value: SocialPlatform.TIKTOK, label: "TikTok", icon: "🎵" },
    { value: SocialPlatform.TELEGRAM, label: "Telegram", icon: "✈️" },
    { value: SocialPlatform.DISCORD, label: "Discord", icon: "🎮" },
    { value: SocialPlatform.LINKEDIN, label: "LinkedIn", icon: "💼" },
    { value: SocialPlatform.WEBSITE, label: t("website"), icon: "🌐" },
  ];

  const addLink = () => {
    setLinks([
      ...links,
      { platform: SocialPlatform.INSTAGRAM, url: "", order: links.length },
    ]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (
    index: number,
    field: keyof SocialLinkDto,
    value: string | SocialPlatform | number
  ) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const handleSave = () => {
    const validLinks = links
      .filter((l) => l.url.trim() !== "")
      .map((l, i) => ({ ...l, order: i }));
    onSave(validLinks);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("noLinks")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-[140px]">
                    <Select
                      value={link.platform}
                      onValueChange={(value) =>
                        updateLink(index, "platform", value as SocialPlatform)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platformOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(index, "url", e.target.value)}
                      placeholder={t("urlPlaceholder")}
                      className="h-9"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={addLink}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addLink")}
          </Button>
        </div>

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
