import { Metadata } from "next";
import { notFound } from "next/navigation";
import { landingPagesApi } from "@/lib/api/landing-pages";
import { PublicLandingPage } from "@/components/public-landing/public-landing-page";

interface Props {
  params: Promise<{ creator: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { creator } = await params;

  try {
    const data = await landingPagesApi.getPublicPage(creator);

    return {
      title: data.landingPage.metaTitle || data.organization.name,
      description:
        data.landingPage.metaDescription ||
        `Découvrez les offres de ${data.organization.name}`,
      openGraph: {
        title: data.landingPage.metaTitle || data.organization.name,
        description:
          data.landingPage.metaDescription ||
          `Découvrez les offres de ${data.organization.name}`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Page introuvable",
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
