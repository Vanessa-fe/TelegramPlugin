import { getTranslations } from 'next-intl/server';

export async function SocialProof() {
  const t = await getTranslations('marketing.socialProof');
  const items = [
    {
      icon: t('items.item1.icon'),
      title: t('items.item1.title'),
      description: t('items.item1.description'),
    },
    {
      icon: t('items.item2.icon'),
      title: t('items.item2.title'),
      description: t('items.item2.description'),
    },
    {
      icon: t('items.item3.icon'),
      title: t('items.item3.title'),
      description: t('items.item3.description'),
    },
  ];

  return (
    <section className="py-12 lg:py-16 bg-purple-50 border-b border-border-custom">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={item.title}
              className={`reveal-on-load lift-on-hover bg-white rounded-2xl border border-border-custom p-6 text-center shadow-sm ${
                index === 0
                  ? 'reveal-delay-1'
                  : index === 1
                    ? 'reveal-delay-2'
                    : 'reveal-delay-3'
              }`}
            >
              <div
                className="text-3xl mb-3"
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-1">
                {item.title}
              </h3>
              <p className="text-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
