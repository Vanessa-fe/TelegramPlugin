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
