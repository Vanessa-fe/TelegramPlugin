import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import {
  Navbar,
  Hero,
  TelegramStarsBanner,
  SocialProof,
  WhySublynk,
  HowItWorks,
  Features,
  Differentiators,
  PricingTeaser,
  FinalCTA,
  Footer,
} from '@/components/marketing';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.hero');
  const title = `${t('title.line1')} ${t('title.line2')}`;
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/',
    title,
    description: t('subtitle'),
    locale,
  });
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <TelegramStarsBanner />
      <SocialProof />
      <WhySublynk />
      <HowItWorks />
      <Features />
      <Differentiators />
      <PricingTeaser />
      <FinalCTA />
      <Footer />
    </div>
  );
}
