import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import {
  Navbar,
  Hero,
  SocialProof,
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
  return buildMetadata({ canonical: '/', title, description: t('subtitle') });
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Differentiators />
      <PricingTeaser />
      <FinalCTA />
      <Footer />
    </div>
  );
}
