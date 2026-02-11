"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  EyeOff,
  ExternalLink,
  Share2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ElementCard } from "./element-card";
import { ElementEditor } from "./element-editor";
import { AddElementDialog } from "./add-element-dialog";
import { SocialLinksEditor } from "./social-links-editor";
import { PagePreview } from "./page-preview";
import { landingPagesApi } from "@/lib/api/landing-pages";
import {
  LandingPageElementType,
  type LandingPage,
  type LandingPageElement,
  type UpdateElementDto,
  type CreateElementDto,
  type SocialLinkDto,
} from "@/types/landing-page";

interface PageEditorProps {
  initialData: LandingPage;
  organizationSlug: string;
  initialPageSlug?: string | null;
}

export function PageEditor({ initialData, organizationSlug, initialPageSlug }: PageEditorProps) {
  const t = useTranslations("landingPages.editor");
  const tCommon = useTranslations("common");
  const [landingPage, setLandingPage] = useState<LandingPage>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [editingElement, setEditingElement] =
    useState<LandingPageElement | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSocialLinksEditor, setShowSocialLinksEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [themeColor, setThemeColor] = useState(
    landingPage.themeColor || "#7c3aed"
  );
  const [metaTitle, setMetaTitle] = useState(landingPage.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    landingPage.metaDescription || ""
  );
  const [pageSlug, setPageSlug] = useState(initialPageSlug || "");
  const [pageSlugError, setPageSlugError] = useState<string | null>(null);

  const publicPath = pageSlug
    ? `/page/${organizationSlug}/${pageSlug}`
    : `/page/${organizationSlug}`;
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicPath}`
      : publicPath;

  const handleTogglePublish = async () => {
    setIsSaving(true);
    try {
      const updated = landingPage.isPublished
        ? await landingPagesApi.unpublish()
        : await landingPagesApi.publish();
      setLandingPage(updated);
      toast.success(
        landingPage.isPublished ? t("unpublished") : t("published")
      );
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveElement = async (index: number, direction: "up" | "down") => {
    const elements = [...landingPage.elements].sort((a, b) => a.order - b.order);
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= elements.length) return;

    // Swap elements
    [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];

    // Update orders
    const reorderedIds = elements.map((el) => el.id);

    try {
      const updated = await landingPagesApi.reorderElements({
        elementIds: reorderedIds,
      });
      setLandingPage(updated);
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleMoveElementToIndex = async (
    elementId: string,
    newIndex: number
  ) => {
    const elements = [...landingPage.elements].sort((a, b) => a.order - b.order);
    const currentIndex = elements.findIndex((el) => el.id === elementId);

    if (
      currentIndex === -1 ||
      newIndex < 0 ||
      newIndex >= elements.length ||
      newIndex === currentIndex
    ) {
      return;
    }

    const [moved] = elements.splice(currentIndex, 1);
    elements.splice(newIndex, 0, moved);

    try {
      const updated = await landingPagesApi.reorderElements({
        elementIds: elements.map((el) => el.id),
      });
      setLandingPage(updated);
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleEditElement = (element: LandingPageElement) => {
    if (element.type === LandingPageElementType.SOCIAL_LINKS) {
      setShowSocialLinksEditor(true);
    } else {
      setEditingElement(element);
    }
  };

  const handleSaveElement = async (id: string, dto: UpdateElementDto) => {
    try {
      await landingPagesApi.updateElement(id, dto);
      const updated = await landingPagesApi.getMyLandingPage();
      if (updated) {
        setLandingPage(updated);
      }
      toast.success(t("elementSaved"));
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleDeleteElement = async (id: string) => {
    try {
      await landingPagesApi.deleteElement(id);
      const updated = await landingPagesApi.getMyLandingPage();
      if (updated) {
        setLandingPage(updated);
      }
      toast.success(t("elementDeleted"));
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleAddElement = async (type: LandingPageElementType) => {
    const dto: CreateElementDto = {
      type,
      order: landingPage.elements.length,
    };

    try {
      await landingPagesApi.addElement(dto);
      const updated = await landingPagesApi.getMyLandingPage();
      if (updated) {
        setLandingPage(updated);
      }
      toast.success(t("elementAdded"));
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleSaveSocialLinks = async (links: SocialLinkDto[]) => {
    try {
      const updated = await landingPagesApi.updateSocialLinks({
        socialLinks: links,
      });
      setLandingPage(updated);
      toast.success(t("socialLinksSaved"));
    } catch {
      toast.error(t("saveError"));
    }
  };

  const validatePageSlug = (value: string): string | null => {
    if (!value) return null;
    if (value.length < 3) return t("slugTooShort");
    if (value.length > 30) return t("slugTooLong");
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 2) {
      return t("slugInvalidFormat");
    }
    return null;
  };

  const handlePageSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setPageSlug(normalized);
    setPageSlugError(validatePageSlug(normalized));
  };

  const handleSaveSettings = async () => {
    // Validate pageSlug first
    if (pageSlug) {
      const error = validatePageSlug(pageSlug);
      if (error) {
        setPageSlugError(error);
        return;
      }
    }

    setIsSaving(true);
    try {
      // Save landing page settings
      const updated = await landingPagesApi.update({
        themeColor,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      });
      setLandingPage(updated);

      // Save pageSlug separately
      await landingPagesApi.updatePageSlug(pageSlug || null);

      setShowSettings(false);
      toast.success(t("settingsSaved"));
    } catch (err) {
      if (err instanceof Error && err.message.includes("slug")) {
        setPageSlugError(t("slugTaken"));
      } else {
        toast.error(t("saveError"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePageSlug = async () => {
    if (pageSlug) {
      const error = validatePageSlug(pageSlug);
      if (error) {
        setPageSlugError(error);
        return;
      }
    }

    setIsSaving(true);
    try {
      await landingPagesApi.updatePageSlug(pageSlug || null);
      setPageSlugError(null);
      toast.success(t("settingsSaved"));
    } catch (err) {
      if (err instanceof Error && err.message.includes("slug")) {
        setPageSlugError(t("slugTaken"));
      } else {
        toast.error(t("saveError"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const sortedElements = [...landingPage.elements].sort(
    (a, b) => a.order - b.order
  );
  const existingTypes = landingPage.elements.map((el) => el.type);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left side - Preview */}
      <div className="flex-1 order-2 lg:order-1">
        <div className="sticky top-0 h-[calc(100vh-180px)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{t("preview")}</h3>
            {landingPage.isPublished && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                {t("viewLive")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden bg-white">
            <PagePreview landingPage={landingPage} themeColor={themeColor} />
          </div>
        </div>
      </div>

      {/* Right side - Editor */}
      <div className="w-full lg:w-[400px] order-1 lg:order-2 space-y-4">
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleTogglePublish}
            disabled={isSaving}
            variant={landingPage.isPublished ? "outline" : "default"}
            className="flex-1"
          >
            {landingPage.isPublished ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                {t("unpublish")}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                {t("publish")}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Status indicator */}
        <div
          className={`p-3 rounded-lg text-sm ${
            landingPage.isPublished
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {landingPage.isPublished ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>{t("statusPublished")}</span>
              <span className="text-xs opacity-70">• {publicUrl}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>{t("statusDraft")}</span>
            </div>
          )}
        </div>

        {/* Custom URL - always visible */}
        <div className="p-4 rounded-lg border bg-purple-50 border-purple-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{t("customUrl")}</h4>
            {landingPage.isPublished && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                {t("viewLive")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              /page/{organizationSlug}/
            </span>
            <Input
              id="pageSlug"
              value={pageSlug}
              onChange={(e) => handlePageSlugChange(e.target.value)}
              placeholder={organizationSlug}
              className={pageSlugError ? "border-destructive" : ""}
            />
          </div>
          {pageSlugError ? (
            <p className="text-xs text-destructive">{pageSlugError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("customUrlHelp")}</p>
          )}
          <p className="text-xs text-muted-foreground break-all">{publicUrl}</p>
          <Button onClick={handleSavePageSlug} disabled={isSaving} className="w-full">
            {tCommon("save")}
          </Button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="p-4 rounded-lg border bg-white space-y-4">
            <h4 className="font-medium">{t("settings")}</h4>

            <div>
              <Label htmlFor="themeColor">{t("themeColor")}</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  id="themeColor"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="metaTitle">{t("metaTitle")}</Label>
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={t("metaTitlePlaceholder")}
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {metaTitle.length}/60
              </p>
            </div>

            <div>
              <Label htmlFor="metaDescription">{t("metaDescription")}</Label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={t("metaDescriptionPlaceholder")}
                maxLength={160}
                className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {metaDescription.length}/160
              </p>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full"
            >
              {t("saveSettings")}
            </Button>
          </div>
        )}

        {/* Elements list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{t("elements")}</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSocialLinksEditor(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t("socialLinks")}
            </Button>
          </div>

          {sortedElements.map((element, index) => (
            <ElementCard
              key={element.id}
              element={element}
              isFirst={index === 0}
              isLast={index === sortedElements.length - 1}
              onMoveUp={() => handleMoveElement(index, "up")}
              onMoveDown={() => handleMoveElement(index, "down")}
              onEdit={() => handleEditElement(element)}
              onDelete={() => handleDeleteElement(element.id)}
            />
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addElement")}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ElementEditor
        element={editingElement}
        open={!!editingElement}
        onOpenChange={(open) => !open && setEditingElement(null)}
        onSave={handleSaveElement}
        onReorder={handleMoveElementToIndex}
        totalElements={landingPage.elements.length}
      />

      <AddElementDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSelect={handleAddElement}
        existingTypes={existingTypes}
      />

      <SocialLinksEditor
        socialLinks={landingPage.socialLinks}
        open={showSocialLinksEditor}
        onOpenChange={setShowSocialLinksEditor}
        onSave={handleSaveSocialLinks}
      />
    </div>
  );
}
