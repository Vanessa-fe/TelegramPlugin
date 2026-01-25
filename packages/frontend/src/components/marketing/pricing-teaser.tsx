import Link from 'next/link';

const features = ['0% commission', 'Unlimited products', 'All platforms'];

export function PricingTeaser() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Section title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#1A1523] mb-12">
          Simple, transparent pricing
        </h2>

        {/* Pricing card */}
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-[#E9E3EF] bg-white p-8 shadow-sm">
            {/* Price */}
            <div className="text-center mb-8">
              <p className="text-5xl font-bold text-[#1A1523]">
                €39
                <span className="text-lg font-normal text-[#6F6E77]">/month</span>
              </p>
            </div>

            {/* Features list */}
            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-purple-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[#1A1523]">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/pricing"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-4 rounded-lg text-center transition-colors duration-150 shadow-sm hover:shadow-md"
            >
              View full pricing →
            </Link>

            {/* Note */}
            <p className="text-center text-sm text-[#6F6E77] mt-4">
              14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
