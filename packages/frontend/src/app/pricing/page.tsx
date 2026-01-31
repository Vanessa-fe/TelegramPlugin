import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { getTranslations } from 'next-intl/server';

export default async function PricingPage() {
  const t = await getTranslations('pricing');
  const includedFeatures = [
    t('features.item1'),
    t('features.item2'),
    t('features.item3'),
    t('features.item4'),
    t('features.item5'),
    t('features.item6'),
    t('features.item7'),
    t('features.item8'),
    t('features.item9'),
    t('features.item10'),
  ];
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1A1523] mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-[#6F6E77] max-w-2xl mx-auto">
            {t('hero.subtitle')}
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
                {t('pricingCard.badge')}
              </span>
            </div>

            {/* Plan name */}
            <h2 className="text-2xl font-bold text-[#1A1523] text-center mb-2">
              {t('pricingCard.planName')}
            </h2>
            <p className="text-[#6F6E77] text-center mb-6">
              {t('pricingCard.planSubtitle')}
            </p>

            {/* Price */}
            <div className="text-center mb-8">
              <p className="text-5xl font-bold text-[#1A1523]">
                {t('pricingCard.price')}
                <span className="text-lg font-normal text-[#6F6E77]">
                  {t('pricingCard.perMonth')}
                </span>
              </p>
              <p className="text-purple-600 font-medium mt-2">
                {t('pricingCard.commission')}
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/register"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-4 rounded-lg text-center transition-colors duration-150 shadow-sm hover:shadow-md mb-4"
            >
              {t('pricingCard.cta')}
            </Link>
            <p className="text-center text-sm text-[#6F6E77]">
              {t('pricingCard.ctaNote')}
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
            {t('comparison.title')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">0%</div>
              <p className="text-[#6F6E77]">{t('comparison.cards.card1')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">€39</div>
              <p className="text-[#6F6E77]">{t('comparison.cards.card2')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {t('comparison.cards.card3Title')}
              </div>
              <p className="text-[#6F6E77]">{t('comparison.cards.card3')}</p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white rounded-xl border border-[#E9E3EF]">
            <p className="text-center text-[#6F6E77]">
              <span className="font-semibold text-[#1A1523]">
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
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-[#1A1523] mb-12">
            {t('faqs.title')}
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
