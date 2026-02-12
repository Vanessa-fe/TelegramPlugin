import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function Hero() {
  const t = await getTranslations('marketing.hero');

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="reveal-on-load text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6">
            {t('title.line1')}
            <br />
            <span className="text-purple-600">{t('title.line2')}</span>
          </h1>

          {/* Subheadline */}
          <p className="reveal-on-load reveal-delay-1 text-lg lg:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          {/* CTAs */}
          <div className="reveal-on-load reveal-delay-2 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="lift-on-hover bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-sm hover:shadow-md text-base"
            >
              {t('cta.primary')}
            </Link>
            <Link
              href="/pricing"
              className="lift-on-hover bg-white hover:bg-purple-50 text-text-primary font-semibold px-8 py-4 rounded-lg border border-border-custom hover:border-purple-200 transition-colors duration-150 text-base"
            >
              {t('cta.secondary')}
            </Link>
          </div>

          {/* Trust signal */}
          <p className="reveal-on-load reveal-delay-3 mt-8 text-sm text-text-secondary">
            {t('trust')}
          </p>
        </div>
      </div>

      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="float-slow absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-purple-100/40 to-transparent rounded-full blur-3xl" />
      </div>
    </section>
  );
}
