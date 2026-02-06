import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { Shield, Heart, Zap } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/about',
    title: t('hero.title'),
    description: t('hero.body'),
    locale,
  });
}

export default async function AboutPage() {
  const t = await getTranslations('about');
  const values = [
    {
      icon: Shield,
      title: t('values.items.item1.title'),
      description: t('values.items.item1.description'),
    },
    {
      icon: Heart,
      title: t('values.items.item2.title'),
      description: t('values.items.item2.description'),
    },
    {
      icon: Zap,
      title: t('values.items.item3.title'),
      description: t('values.items.item3.description'),
    },
  ];
  const stats = [
    {
      value: t('stats.items.item1.value'),
      label: t('stats.items.item1.label'),
    },
    {
      value: t('stats.items.item2.value'),
      label: t('stats.items.item2.label'),
    },
    {
      value: t('stats.items.item3.value'),
      label: t('stats.items.item3.label'),
    },
    {
      value: t('stats.items.item4.value'),
      label: t('stats.items.item4.label'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1A1523] mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-[#6F6E77] leading-relaxed">
              {t('hero.body')}
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 lg:py-20 bg-[#FDFAFF]">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1523] mb-6">
                {t('story.title')}
              </h2>
              <div className="space-y-4 text-[#6F6E77]">
                <p>{t('story.paragraphs.p1')}</p>
                <p>{t('story.paragraphs.p2')}</p>
                <p>{t('story.paragraphs.p3')}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E9E3EF] p-8">
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-4xl font-bold text-purple-600">
                      {stat.value}
                    </p>
                    <p className="text-sm text-[#6F6E77] mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1523] text-center mb-12">
            {t('values.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1523] mb-2">
                  {value.title}
                </h3>
                <p className="text-[#6F6E77]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-purple-600">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-purple-200 mb-8 max-w-xl mx-auto">
            {t('cta.body')}
          </p>
          <Link
            href="/register"
            className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
