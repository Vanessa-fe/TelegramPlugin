const features = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
    title: 'Subscriptions',
    description: 'Recurring revenue with automatic renewal and billing',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: 'One-time payments',
    description: 'Sell lifetime access or single purchases',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
        />
      </svg>
    ),
    title: 'Auto-access',
    description: 'Members get instant access after payment',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
    title: 'Multi-platform',
    description: 'Telegram, Discord, WhatsApp. One dashboard.',
  },
];

export function Features() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Section title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#1A1523] mb-16">
          Everything you need to monetize
        </h2>

        {/* Features grid 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 p-6 rounded-xl border border-[#E9E3EF] bg-white hover:shadow-md transition-shadow duration-200"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                {feature.icon}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold text-[#1A1523] mb-1">
                  {feature.title}
                </h3>
                <p className="text-[#6F6E77] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
