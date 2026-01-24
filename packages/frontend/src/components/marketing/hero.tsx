import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1A1523] mb-6">
            Monetize your community.
            <br />
            <span className="text-purple-600">Keep 100% of your revenue.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg lg:text-xl text-[#6F6E77] mb-10 max-w-2xl mx-auto leading-relaxed">
            Sell subscriptions and one-time access to your Telegram, Discord,
            and WhatsApp communities. EU-based. GDPR-compliant. Zero commission.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-sm hover:shadow-md text-base"
            >
              Start monetizing →
            </Link>
            <Link
              href="/pricing"
              className="bg-white hover:bg-purple-50 text-[#1A1523] font-semibold px-8 py-4 rounded-lg border border-[#E9E3EF] hover:border-purple-200 transition-colors duration-150 text-base"
            >
              View pricing
            </Link>
          </div>

          {/* Trust signal */}
          <p className="mt-8 text-sm text-[#6F6E77]">
            No credit card required • Setup in 5 minutes
          </p>
        </div>
      </div>

      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-purple-100/40 to-transparent rounded-full blur-3xl" />
      </div>
    </section>
  );
}
