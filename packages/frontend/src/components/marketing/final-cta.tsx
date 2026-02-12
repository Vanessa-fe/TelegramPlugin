import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function FinalCTA() {
  const t = await getTranslations('marketing.finalCta');

  return (
    <section className="py-20 lg:py-28 bg-purple-600">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
        {/* Title */}
        <h2 className="reveal-on-load text-3xl lg:text-4xl font-bold text-white mb-6">
          {t('title')}
        </h2>

        {/* CTA */}
        <Link
          href="/register"
          className="reveal-on-load reveal-delay-1 lift-on-hover inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md hover:shadow-lg text-base"
        >
          {t('cta')}
        </Link>

        {/* Note */}
        <p className="reveal-on-load reveal-delay-2 mt-6 text-purple-200 text-sm">{t('note')}</p>
      </div>
    </section>
  );
}
