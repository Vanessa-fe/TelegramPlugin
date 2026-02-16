import { getTranslations } from 'next-intl/server';
import { Star } from 'lucide-react';

export async function Testimonials() {
  const t = await getTranslations('marketing.testimonials');

  const testimonials = [
    {
      quote: t('items.item1.quote'),
      name: t('items.item1.name'),
      role: t('items.item1.role'),
    },
    {
      quote: t('items.item2.quote'),
      name: t('items.item2.name'),
      role: t('items.item2.role'),
    },
    {
      quote: t('items.item3.quote'),
      name: t('items.item3.name'),
      role: t('items.item3.role'),
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <h2 className="reveal-on-load text-3xl lg:text-4xl font-bold text-center text-text-primary mb-16">
          {t('title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className={`reveal-on-load lift-on-hover bg-surface rounded-2xl border border-border-custom p-6 ${
                index === 0
                  ? 'reveal-delay-1'
                  : index === 1
                    ? 'reveal-delay-2'
                    : 'reveal-delay-3'
              }`}
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <blockquote className="text-text-primary mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold text-sm">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-text-secondary text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
