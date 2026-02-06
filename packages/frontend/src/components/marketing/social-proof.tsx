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
    <section className="py-12 lg:py-16 bg-[#F6EEFF] border-b border-[#E9E3EF]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border border-[#E9E3EF] p-6 text-center shadow-sm"
            >
              <div
                className="text-3xl mb-3"
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-[#1A1523] mb-1">
                {item.title}
              </h3>
              <p className="text-[#6F6E77]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
