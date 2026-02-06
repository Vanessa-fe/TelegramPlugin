import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms');
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/terms',
    title: t('title'),
    description: t('meta.description'),
    locale,
  });
}

export default async function TermsPage() {
  const t = await getTranslations('terms');

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <h2>{t('sections.acceptance.title')}</h2>
      <p>{t('sections.acceptance.body')}</p>

      <h2>{t('sections.description.title')}</h2>
      <p>{t('sections.description.body')}</p>
      <ul>
        <li>{t('sections.description.list.item1')}</li>
        <li>{t('sections.description.list.item2')}</li>
        <li>{t('sections.description.list.item3')}</li>
        <li>{t('sections.description.list.item4')}</li>
      </ul>

      <h2>{t('sections.account.title')}</h2>
      <p>{t('sections.account.body')}</p>
      <ul>
        <li>{t('sections.account.list.item1')}</li>
        <li>{t('sections.account.list.item2')}</li>
        <li>{t('sections.account.list.item3')}</li>
        <li>{t('sections.account.list.item4')}</li>
      </ul>

      <h2>{t('sections.fees.title')}</h2>
      <h3>{t('sections.fees.subscription.title')}</h3>
      <p>{t('sections.fees.subscription.body')}</p>

      <h3>{t('sections.fees.trial.title')}</h3>
      <p>{t('sections.fees.trial.body')}</p>

      <h3>{t('sections.fees.billing.title')}</h3>
      <p>{t('sections.fees.billing.body')}</p>

      <h2>{t('sections.acceptableUse.title')}</h2>
      <p>{t('sections.acceptableUse.body')}</p>
      <ul>
        <li>{t('sections.acceptableUse.list.item1')}</li>
        <li>{t('sections.acceptableUse.list.item2')}</li>
        <li>{t('sections.acceptableUse.list.item3')}</li>
        <li>{t('sections.acceptableUse.list.item4')}</li>
        <li>{t('sections.acceptableUse.list.item5')}</li>
        <li>{t('sections.acceptableUse.list.item6')}</li>
        <li>{t('sections.acceptableUse.list.item7')}</li>
      </ul>

      <h2>{t('sections.responsibilities.title')}</h2>
      <p>{t('sections.responsibilities.body')}</p>
      <ul>
        <li>{t('sections.responsibilities.list.item1')}</li>
        <li>{t('sections.responsibilities.list.item2')}</li>
        <li>{t('sections.responsibilities.list.item3')}</li>
        <li>{t('sections.responsibilities.list.item4')}</li>
        <li>{t('sections.responsibilities.list.item5')}</li>
      </ul>

      <h2>{t('sections.intellectualProperty.title')}</h2>
      <p>{t('sections.intellectualProperty.body')}</p>

      <h2>{t('sections.liability.title')}</h2>
      <p>{t('sections.liability.body')}</p>

      <h2>{t('sections.availability.title')}</h2>
      <p>{t('sections.availability.body')}</p>

      <h2>{t('sections.termination.title')}</h2>
      <p>{t('sections.termination.body')}</p>

      <h2>{t('sections.changes.title')}</h2>
      <p>{t('sections.changes.body')}</p>

      <h2>{t('sections.governingLaw.title')}</h2>
      <p>{t('sections.governingLaw.body')}</p>

      <h2>{t('sections.contact.title')}</h2>
      <p>
        {t('sections.contact.body')}{' '}
        <a href="mailto:legal@telegramplugin.com">
          {t('sections.contact.email')}
        </a>
        .
      </p>
    </LegalLayout>
  );
}
