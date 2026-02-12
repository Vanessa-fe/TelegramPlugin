import { getTranslations } from 'next-intl/server';

export async function HowItWorks() {
  const t = await getTranslations('marketing.howItWorks');
  const steps = [
    {
      number: '1',
      title: t('steps.item1.title'),
      description: t('steps.item1.description'),
    },
    {
      number: '2',
      title: t('steps.item2.title'),
      description: t('steps.item2.description'),
    },
    {
      number: '3',
      title: t('steps.item3.title'),
      description: t('steps.item3.description'),
    },
    {
      number: '4',
      title: t('steps.item4.title'),
      description: t('steps.item4.description'),
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-surface">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Section title */}
        <h2 className="reveal-on-load text-3xl lg:text-4xl font-bold text-center text-text-primary mb-16">
          {t('title')}
        </h2>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`reveal-on-load lift-on-hover relative text-center ${
                index === 0
                  ? 'reveal-delay-1'
                  : index === 1
                    ? 'reveal-delay-2'
                    : index === 2
                      ? 'reveal-delay-3'
                      : 'reveal-delay-4'
              }`}
            >
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-6 left-1/2 w-full h-px bg-border-custom" />
              )}

              {/* Step number */}
              <div className="pulse-ring-soft relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg mb-4">
                {step.number}
              </div>

              {/* Step content */}
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
