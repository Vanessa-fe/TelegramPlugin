"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

import { landingPagesApi } from "@/lib/api/landing-pages";
import { PageEditor } from "@/components/landing-pages";
import { Button } from "@/components/ui/button";
import type { LandingPage } from "@/types/landing-page";

export default function PageBuilderPage() {
  const t = useTranslations("landingPages");
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [pageSlug, setPageSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadLandingPage = useCallback(async () => {
    try {
      const [data, slugData] = await Promise.all([
        landingPagesApi.getMyLandingPage(),
        landingPagesApi.getPageSlug().catch(() => null),
      ]);
      setLandingPage(data);
      setPageSlug(slugData?.pageSlug ?? null);
    } catch (error) {
      // 404 is expected if landing page doesn't exist yet
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (axiosError.response?.status !== 404) {
        toast.error(axiosError.response?.data?.message || t("errors.load"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadLandingPage();
  }, [loadLandingPage]);

  async function handleCreateLandingPage() {
    setIsCreating(true);
    try {
      const data = await landingPagesApi.create();
      setLandingPage(data);
      toast.success(t("created"));
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("errors.create"));
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-text-secondary">{t("subtitle")}</p>
        </div>

        <div className="bg-white rounded-xl border border-border-custom p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {t("empty.title")}
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            {t("empty.description")}
          </p>

          <Button
            onClick={handleCreateLandingPage}
            disabled={isCreating}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              t("empty.cta")
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
          {t("title")}
        </h1>
        <p className="mt-1 text-text-secondary">{t("subtitle")}</p>
      </div>

      <PageEditor
        initialData={landingPage}
        organizationSlug={landingPage.organization.slug}
        initialPageSlug={pageSlug}
      />
    </div>
  );
}
