import { getTranslations } from 'next-intl/server';
import { Check, X, Clock } from 'lucide-react';

export async function CompetitorsTable() {
  const t = await getTranslations('pricing.competitors');

  const features = [
    { key: 'telegramStars', sublynk: true, sublaunch: false, launchpass: false, crevio: false },
    { key: 'whatsapp', sublynk: true, sublaunch: true, launchpass: false, crevio: false },
    { key: 'discord', sublynk: true, sublaunch: true, launchpass: true, crevio: true },
    { key: 'affiliates', sublynk: 'free', sublaunch: 'paid', launchpass: false, crevio: 'soon' },
    { key: 'coupons', sublynk: 'free', sublaunch: null, launchpass: null, crevio: true },
    { key: 'frenchSupport', sublynk: true, sublaunch: false, launchpass: false, crevio: false },
    { key: 'minFees', sublynk: '1.5%', sublaunch: '3%', launchpass: null, crevio: '1%' },
    { key: 'freePlanFees', sublynk: '6%', sublaunch: '15%', launchpass: null, crevio: '5%' },
  ];

  const renderCell = (value: boolean | string | null) => {
    if (value === true) {
      return <Check className="w-5 h-5 text-green-600 mx-auto" />;
    }
    if (value === false) {
      return <X className="w-5 h-5 text-red-400 mx-auto" />;
    }
    if (value === 'soon') {
      return <Clock className="w-5 h-5 text-amber-500 mx-auto" />;
    }
    if (value === null) {
      return <span className="text-text-muted">—</span>;
    }
    if (value === 'free') {
      return (
        <span className="inline-flex items-center gap-1">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-600 font-medium">{t('free')}</span>
        </span>
      );
    }
    if (value === 'paid') {
      return (
        <span className="inline-flex items-center gap-1">
          <Check className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-600 font-medium">{t('paid')}</span>
        </span>
      );
    }
    return <span className="font-medium text-text-primary">{value}</span>;
  };

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center text-text-primary mb-12">
          {t('title')}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-custom">
                <th className="text-left py-4 px-4 text-text-secondary font-medium">
                  {t('feature')}
                </th>
                <th className="py-4 px-4 text-center bg-purple-50 rounded-t-lg">
                  <span className="font-bold text-purple-600">Sublynk</span>
                </th>
                <th className="py-4 px-4 text-center text-text-secondary font-medium">
                  Sublaunch
                </th>
                <th className="py-4 px-4 text-center text-text-secondary font-medium">
                  LaunchPass
                </th>
                <th className="py-4 px-4 text-center text-text-secondary font-medium">
                  Crevio
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={feature.key}
                  className={`border-b border-border-custom ${
                    index % 2 === 0 ? 'bg-white' : 'bg-surface'
                  }`}
                >
                  <td className="py-4 px-4 text-text-primary text-sm">
                    {t(`features.${feature.key}`)}
                  </td>
                  <td className="py-4 px-4 text-center bg-purple-50/50">
                    {renderCell(feature.sublynk)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {renderCell(feature.sublaunch)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {renderCell(feature.launchpass)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {renderCell(feature.crevio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
