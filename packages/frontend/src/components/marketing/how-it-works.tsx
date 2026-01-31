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
    <section className="py-20 lg:py-28 bg-[#FDFAFF]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Section title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#1A1523] mb-16">
          {t('title')}
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
