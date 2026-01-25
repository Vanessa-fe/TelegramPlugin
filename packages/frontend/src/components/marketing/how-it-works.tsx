const steps = [
  {
    number: '1',
    title: 'Create',
    description: 'Set your pricing and access rules',
  },
  {
    number: '2',
    title: 'Connect',
    description: 'Link your Telegram, Discord, or WhatsApp',
  },
  {
    number: '3',
    title: 'Sell',
    description: 'Share your payment link anywhere',
  },
  {
    number: '4',
    title: 'Access',
    description: 'Members get instant access automatically',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-[#FDFAFF]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Section title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#1A1523] mb-16">
          How it works
        </h2>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-1/2 w-full h-px bg-[#E9E3EF]" />
              )}

              {/* Step number */}
              <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg mb-4">
                {step.number}
              </div>

              {/* Step content */}
              <h3 className="text-xl font-semibold text-[#1A1523] mb-2">
                {step.title}
              </h3>
              <p className="text-[#6F6E77] text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
