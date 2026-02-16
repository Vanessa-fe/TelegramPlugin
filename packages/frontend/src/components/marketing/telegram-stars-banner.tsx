import { getTranslations } from 'next-intl/server';
import { Star } from 'lucide-react';

export async function TelegramStarsBanner() {
  const t = await getTranslations('marketing.telegramStarsBanner');

  return (
    <section className="reveal-on-load bg-gradient-to-r from-purple-600 to-purple-700 py-4">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span className="text-white font-semibold">{t('badge')}</span>
          </div>
          <span className="text-purple-100 text-sm">{t('text')}</span>
        </div>
      </div>
    </section>
  );
}
