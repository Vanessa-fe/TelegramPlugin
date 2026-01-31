import { Fragment } from 'react';
import { getTranslations } from 'next-intl/server';

export async function SocialProof() {
  const t = await getTranslations('marketing.socialProof');
  const items = [
    {
      value: t('items.item1.value'),
      label: t('items.item1.label'),
    },
    {
      value: t('items.item2.value'),
      label: t('items.item2.label'),
    },
    {
      value: t('items.item3.value'),
      label: t('items.item3.label'),
    },
  ];

  return (
    <section className="py-12 border-b border-[#E9E3EF]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {items.map((item, index) => (
            <Fragment key={item.label}>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1A1523]">
                  {item.value}
                </p>
                <p className="text-sm text-[#6F6E77]">{item.label}</p>
              </div>
              {index < items.length - 1 && (
                <div className="hidden sm:block w-px h-12 bg-[#E9E3EF]" />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
