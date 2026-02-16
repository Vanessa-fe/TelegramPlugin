import { getTranslations } from 'next-intl/server';
import { Star, Users, Globe, MessageCircle, Percent } from 'lucide-react';

export async function WhySublynk() {
  const t = await getTranslations('marketing.whySublynk');

  const reasons = [
    {
      icon: Star,
      title: t('items.item1.title'),
      description: t('items.item1.description'),
    },
    {
      icon: Users,
      title: t('items.item2.title'),
      description: t('items.item2.description'),
    },
    {
      icon: Globe,
      title: t('items.item3.title'),
      description: t('items.item3.description'),
    },
    {
      icon: MessageCircle,
      title: t('items.item4.title'),
      description: t('items.item4.description'),
    },
    {
      icon: Percent,
      title: t('items.item5.title'),
      description: t('items.item5.description'),
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-surface">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <h2 className="reveal-on-load text-3xl lg:text-4xl font-bold text-center text-text-primary mb-16">
          {t('title')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((item, index) => (
            <div
              key={item.title}
              className={`reveal-on-load lift-on-hover text-center p-6 rounded-xl bg-white border border-border-custom ${
                index === 0
                  ? 'reveal-delay-1'
                  : index === 1
                    ? 'reveal-delay-2'
                    : index === 2
                      ? 'reveal-delay-3'
                      : 'reveal-delay-4'
              }`}
            >
              <div className="pulse-ring-soft inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 text-purple-600 mb-5">
                <item.icon className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {item.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
