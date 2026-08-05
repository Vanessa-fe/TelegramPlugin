import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { generateBreadcrumbSchema, renderJsonLd } from '@/lib/json-ld';
import { PricingViewTracker } from '@/components/analytics/pricing-view-tracker';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pricing');
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/pricing',
    title: t('hero.title'),
    description: t('hero.subtitle'),
    locale,
  });
}

export default async function PricingPage() {
  const t = await getTranslations('pricing');
  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Tarifs', url: '/pricing' },
  ];
  const planNames = ['starter', 'growth', 'pro'] as const;
  const plans = planNames.map((planName) => ({
    key: planName,
    name: t(`plans.${planName}.name`),
    subtitle: t(`plans.${planName}.subtitle`),
    price: t(`plans.${planName}.price`),
    perMonth: t(`plans.${planName}.perMonth`),
    commission: t(`plans.${planName}.commission`),
    cta: t(`plans.${planName}.cta`),
    ctaNote: t(`plans.${planName}.ctaNote`),
    href: `/register?plan=${planName}&source=pricing`,
    features: [
      t(`plans.${planName}.features.item1`),
      t(`plans.${planName}.features.item2`),
      t(`plans.${planName}.features.item3`),
    ],
  }));
  const faqs = [
    {
      question: t('faqs.items.item1.question'),
      answer: t('faqs.items.item1.answer'),
    },
    {
      question: t('faqs.items.item2.question'),
      answer: t('faqs.items.item2.answer'),
    },
    {
      question: t('faqs.items.item3.question'),
      answer: t('faqs.items.item3.answer'),
    },
    {
      question: t('faqs.items.item4.question'),
      answer: t('faqs.items.item4.answer'),
    },
    {
      question: t('faqs.items.item5.question'),
      answer: t('faqs.items.item5.answer'),
    },
    {
      question: t('faqs.items.item6.question'),
      answer: t('faqs.items.item6.answer'),
    },
  ];

  const pricingOffers = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Sublynk',
    description:
      'Plateforme SaaS pour monétiser vos canaux Telegram via abonnements',
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '0',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '0',
          priceCurrency: 'EUR',
          unitText: 'MONTH',
        },
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Growth',
        price: '29',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '29',
          priceCurrency: 'EUR',
          unitText: 'MONTH',
        },
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '99',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '99',
          priceCurrency: 'EUR',
          unitText: 'MONTH',
        },
        availability: 'https://schema.org/InStock',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(generateBreadcrumbSchema(breadcrumbItems)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingOffers) }}
      />
      <PricingViewTracker />
      <Navbar />

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isRecommended = plan.key === 'growth';
              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl bg-white p-8 ${
                    isRecommended
                      ? 'border-2 border-purple-600 shadow-lg'
                      : 'border border-border-custom shadow-sm'
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 inline-block bg-purple-100 text-purple-600 text-sm font-semibold px-3 py-1 rounded-full">
                      {t('plans.recommended')}
                    </span>
                  )}

                  <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
                    {plan.name}
                  </h2>
                  <p className="text-text-secondary text-center mb-6">
                    {plan.subtitle}
                  </p>

                  <div className="text-center mb-8">
                    <p className="text-5xl font-bold text-text-primary">
                      {plan.price}
                      <span className="text-lg font-normal text-text-secondary">
                        {plan.perMonth}
                      </span>
                    </p>
                    <p className="text-purple-600 font-medium mt-2">
                      {plan.commission}
                    </p>
                  </div>

                  <Link
                    href={plan.href}
                    className={`block w-full font-semibold px-6 py-4 rounded-lg text-center transition-colors duration-150 mb-4 ${
                      isRecommended
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <p className="text-center text-sm text-text-secondary mb-8">
                    {plan.ctaNote}
                  </p>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
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
                        <span className="text-text-primary text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison note */}
      <section className="py-16 lg:py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-text-primary mb-12">
            {t('comparison.title')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {t('comparison.cards.card1Title')}
              </div>
              <p className="text-text-secondary">{t('comparison.cards.card1')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {t('comparison.cards.card2Title')}
              </div>
              <p className="text-text-secondary">{t('comparison.cards.card2')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {t('comparison.cards.card3Title')}
              </div>
              <p className="text-text-secondary">{t('comparison.cards.card3')}</p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white rounded-xl border border-border-custom">
            <p className="text-center text-text-secondary">
              <span className="font-semibold text-text-primary">
                {t('comparison.example.label')}
              </span>{' '}
              {t('comparison.example.text')}{' '}
              <span className="text-purple-600 font-semibold">
                {t('comparison.example.highlight')}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-text-primary mb-12">
            {t('faqs.title')}
          </h2>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border border-border-custom rounded-xl p-6"
              >
                <h3 className="font-semibold text-text-primary mb-2">
                  {faq.question}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
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
            {t('finalCta.title')}
          </h2>
          <Link
            href="/register"
            className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md hover:shadow-lg"
          >
            {t('finalCta.button')}
          </Link>
          <p className="mt-6 text-purple-200 text-sm">
            {t('finalCta.note')}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
