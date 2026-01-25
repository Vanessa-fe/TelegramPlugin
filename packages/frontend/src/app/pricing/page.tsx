import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';

const includedFeatures = [
  'Unlimited products & plans',
  'Unlimited customers',
  'Telegram, Discord & WhatsApp',
  'Automatic access management',
  'Subscriptions & one-time payments',
  'Direct Stripe payouts',
  'Real-time analytics dashboard',
  'Email notifications (Brevo)',
  'GDPR-compliant data handling',
  'Priority email support',
];

const faqs = [
  {
    question: 'Is there really 0% commission?',
    answer:
      'Yes. We charge a flat monthly fee only. You keep 100% of your revenue. Stripe processing fees (typically 1.4% + €0.25 for EU cards) are separate and go directly to Stripe, not us.',
  },
  {
    question: 'What happens after the free trial?',
    answer:
      "Your account continues to work. We'll send you a reminder before the trial ends. If you don't upgrade, your payment links will pause until you subscribe.",
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. No contracts, no commitments. Cancel from your dashboard with one click. Your existing members keep their access until their subscriptions expire.',
  },
  {
    question: 'Do I need a Stripe account?',
    answer:
      'Yes. We use Stripe Connect so payments go directly to your Stripe account. If you don\'t have one, you can create it during onboarding — it takes about 5 minutes.',
  },
  {
    question: 'Which platforms are supported?',
    answer:
      'Currently Telegram (including Telegram Stars), with Discord and WhatsApp coming soon. You can manage all platforms from a single dashboard.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'We\'re EU-based and fully GDPR-compliant. Your data is stored in European data centers. You can export or delete your data anytime from your dashboard.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1A1523] mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-[#6F6E77] max-w-2xl mx-auto">
            One plan. No hidden fees. No commission on your sales.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-md mx-auto px-4 lg:px-6">
          <div className="rounded-2xl border-2 border-purple-600 bg-white p-8 shadow-lg">
            {/* Badge */}
            <div className="text-center mb-6">
              <span className="inline-block bg-purple-100 text-purple-600 text-sm font-semibold px-3 py-1 rounded-full">
                Most popular
              </span>
            </div>

            {/* Plan name */}
            <h2 className="text-2xl font-bold text-[#1A1523] text-center mb-2">
              Pro
            </h2>
            <p className="text-[#6F6E77] text-center mb-6">
              Everything you need to monetize
            </p>

            {/* Price */}
            <div className="text-center mb-8">
              <p className="text-5xl font-bold text-[#1A1523]">
                €39
                <span className="text-lg font-normal text-[#6F6E77]">/month</span>
              </p>
              <p className="text-purple-600 font-medium mt-2">+ 0% commission</p>
            </div>

            {/* CTA */}
            <Link
              href="/register"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-4 rounded-lg text-center transition-colors duration-150 shadow-sm hover:shadow-md mb-4"
            >
              Start 14-day free trial →
            </Link>
            <p className="text-center text-sm text-[#6F6E77]">
              No credit card required
            </p>

            {/* Divider */}
            <div className="border-t border-[#E9E3EF] my-8" />

            {/* Features */}
            <ul className="space-y-3">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[#1A1523] text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Comparison note */}
      <section className="py-16 lg:py-20 bg-[#FDFAFF]">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-[#1A1523] mb-12">
            Why creators switch to us
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">0%</div>
              <p className="text-[#6F6E77]">commission vs 3-15% elsewhere</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">€39</div>
              <p className="text-[#6F6E77]">flat fee, predictable costs</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">EU</div>
              <p className="text-[#6F6E77]">based & GDPR-compliant</p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white rounded-xl border border-[#E9E3EF]">
            <p className="text-center text-[#6F6E77]">
              <span className="font-semibold text-[#1A1523]">Example:</span> If you
              make €5,000/month, competitors charge €150-750 in commission.{' '}
              <span className="text-purple-600 font-semibold">
                With us, you pay €39. You save €111-711 every month.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-[#1A1523] mb-12">
            Frequently asked questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border border-[#E9E3EF] rounded-xl p-6"
              >
                <h3 className="font-semibold text-[#1A1523] mb-2">
                  {faq.question}
                </h3>
                <p className="text-[#6F6E77] text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-28 bg-purple-600">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to keep 100% of your revenue?
          </h2>
          <Link
            href="/register"
            className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md hover:shadow-lg"
          >
            Start your free trial →
          </Link>
          <p className="mt-6 text-purple-200 text-sm">
            14 days free • No credit card required
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
