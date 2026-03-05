'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AdminPage() {
  const t = useTranslations('admin.home');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/organizations"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">
            {t('cards.organizations.title')}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {t('cards.organizations.description')}
          </p>
        </Link>
        <Link
          href="/admin/gift-codes"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">{t('cards.giftCodes.title')}</h3>
          <p className="mt-2 text-sm text-gray-600">
            {t('cards.giftCodes.description')}
          </p>
        </Link>
        <Link
          href="/admin/billing"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">{t('cards.billing.title')}</h3>
          <p className="mt-2 text-sm text-gray-600">
            {t('cards.billing.description')}
          </p>
        </Link>
      </div>
    </div>
  );
}
