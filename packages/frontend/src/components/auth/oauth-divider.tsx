'use client';

import { useTranslations } from 'next-intl';

export function OAuthDivider() {
  const t = useTranslations('auth.oauth');

  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[#E9E3EF]" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-2 text-[#6F6E77]">{t('or')}</span>
      </div>
    </div>
  );
}
