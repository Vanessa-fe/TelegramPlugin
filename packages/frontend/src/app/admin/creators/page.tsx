'use client';

import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';

export default function CreatorsPage() {
  const t = useTranslations('admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('nav.creators')}</h1>
        <p className="mt-2 text-gray-600">
          Vue d&apos;ensemble des créateurs et détection du risque de churn.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
        <Users className="h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-600">
          Coming Soon - Epic 4 (Phase 2)
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Cette fonctionnalité sera implémentée dans la Phase 2 (Fiche Créateur 360°)
        </p>
      </div>
    </div>
  );
}
