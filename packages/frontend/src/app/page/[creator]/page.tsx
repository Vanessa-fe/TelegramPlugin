import { Metadata } from "next";
import { notFound } from "next/navigation";
import { landingPagesApi } from "@/lib/api/landing-pages";
import { PublicLandingPage } from "@/components/public-landing/public-landing-page";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ creator: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("publicPages");
  const { creator } = await params;

  try {
    const data = await landingPagesApi.getPublicPage(creator);
    const seoDescription =
      data.landingPage.metaDescription ||
      t("seo.creatorDescription", {
        organizationName: data.organization.name,
      });

    return {
      title: data.landingPage.metaTitle || data.organization.name,
      description: seoDescription,
      openGraph: {
        title: data.landingPage.metaTitle || data.organization.name,
        description: seoDescription,
        type: "website",
      },
    };
  } catch {
    return {
      title: t("seo.creatorNotFoundTitle"),
    };
  }
}

export default async function CreatorLandingPage({ params }: Props) {
  const { creator } = await params;

  try {
    const data = await landingPagesApi.getPublicPage(creator);
    return <PublicLandingPage data={data} />;
  } catch {
    notFound();
  }
}
