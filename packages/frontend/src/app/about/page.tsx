import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { Shield, Heart, Zap } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Your data stays yours. We are EU-based, GDPR-compliant, and never sell your information.',
  },
  {
    icon: Heart,
    title: 'Creator-Focused',
    description:
      'Built by creators, for creators. We understand the challenges of monetizing communities.',
  },
  {
    icon: Zap,
    title: 'Simple & Transparent',
    description:
      'No hidden fees, no complex pricing. One flat rate, zero commission on your sales.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1A1523] mb-6">
              Empowering European creators to monetize their communities
            </h1>
            <p className="text-lg text-[#6F6E77] leading-relaxed">
              TelegramPlugin was born from a simple observation: creators in Europe
              deserve better tools. While US-based platforms dominate the market,
              European creators face unique challenges — from payment processing
              restrictions to GDPR compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 lg:py-20 bg-[#FDFAFF]">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1523] mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-[#6F6E77]">
                <p>
                  We started as creators ourselves, running Telegram communities and
                  struggling with the same problems you face: clunky payment solutions,
                  high commissions eating into our revenue, and tools that weren&apos;t
                  designed with European regulations in mind.
                </p>
                <p>
                  In 2025, we decided to build the platform we wished existed. One that
                  puts creators first, respects privacy, and doesn&apos;t take a cut of
                  your hard-earned revenue.
                </p>
                <p>
                  Today, TelegramPlugin helps hundreds of creators across Europe
                  monetize their Telegram, Discord, and WhatsApp communities — without
                  the headaches.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E9E3EF] p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">500+</p>
                  <p className="text-sm text-[#6F6E77] mt-1">Creators</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">€250K+</p>
                  <p className="text-sm text-[#6F6E77] mt-1">Processed</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">0%</p>
                  <p className="text-sm text-[#6F6E77] mt-1">Commission</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">EU</p>
                  <p className="text-sm text-[#6F6E77] mt-1">Based</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1523] text-center mb-12">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1523] mb-2">
                  {value.title}
                </h3>
                <p className="text-[#6F6E77]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-purple-600">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Ready to join us?
          </h2>
          <p className="text-purple-200 mb-8 max-w-xl mx-auto">
            Start monetizing your community today with zero commission and full
            control over your revenue.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md"
          >
            Start your free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
